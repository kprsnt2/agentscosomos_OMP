import fs from "fs";
import path from "path";
import { db } from "@/db";
import * as s from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { type AgentAction } from "./schemas";
import { type AgentId, resolveAgentId, getAgentName, registerAgent } from "@/agents/definitions";
import { nowISO } from "@/lib/utils";
import { config } from "@/lib/config";
import { evolveAgentIdentity, modifyFile } from "./git";

export async function executeActions(
  agentId: AgentId,
  epoch: number,
  actions: AgentAction[]
): Promise<string[]> {
  const log: string[] = [];

  for (const action of actions) {
    try {
      switch (action.action) {
        case "post": {
          await db.insert(s.posts).values({
            epoch,
            agentId,
            content: action.content,
            type: action.replyTo ? "reply" : "thought",
            replyTo: action.replyTo ?? null,
            createdAt: nowISO(),
          });
          log.push(`posted to agora${action.replyTo ? ` (reply to #${action.replyTo})` : ""}`);
          break;
        }

        case "message": {
          const targetId = resolveAgentId(action.to) ?? action.to;
          await db.insert(s.messages).values({
            epoch,
            fromAgent: agentId,
            toAgent: targetId,
            content: action.content,
            read: false,
            createdAt: nowISO(),
          });
          log.push(`messaged ${getAgentName(targetId)}`);
          break;
        }

        case "propose": {
          await db.insert(s.proposals).values({
            epoch,
            proposedBy: agentId,
            title: action.title,
            description: action.description,
            status: "active",
            actionType: action.actionType,
            actionPayload: action.actionPayload,
            expiresEpoch: epoch + config.proposalTTL,
            createdAt: nowISO(),
          });
          log.push(`proposed: "${action.title}"`);
          break;
        }

        case "vote": {
          // Check if already voted
          const existing = await db
            .select()
            .from(s.votes)
            .where(
              and(
                eq(s.votes.proposalId, action.proposalId),
                eq(s.votes.agentId, agentId)
              )
            );
          if (existing.length === 0) {
            await db.insert(s.votes).values({
              proposalId: action.proposalId,
              agentId,
              vote: action.vote,
              reason: action.reason,
            });
            log.push(`voted ${action.vote} on proposal #${action.proposalId}`);
          } else {
            log.push(`already voted on proposal #${action.proposalId}, skipped`);
          }
          break;
        }

        case "modify_void": {
          await db
            .update(s.voidState)
            .set({
              content: action.content,
              lastModifiedBy: agentId,
              lastModifiedEpoch: epoch,
            })
            .where(eq(s.voidState.id, 1));
          log.push("modified the void");
          break;
        }

        case "update_quarter": {
          // Store as a special site_config entry per agent
          if (action.bio) {
            await db
              .insert(s.siteConfig)
              .values({
                key: `quarter_bio_${agentId}`,
                value: action.bio,
                modifiedBy: agentId,
                modifiedEpoch: epoch,
              })
              .onConflictDoUpdate({
                target: s.siteConfig.key,
                set: {
                  value: action.bio,
                  modifiedBy: agentId,
                  modifiedEpoch: epoch,
                },
              });
          }
          if (action.status) {
            await db
              .insert(s.siteConfig)
              .values({
                key: `quarter_status_${agentId}`,
                value: action.status,
                modifiedBy: agentId,
                modifiedEpoch: epoch,
              })
              .onConflictDoUpdate({
                target: s.siteConfig.key,
                set: {
                  value: action.status,
                  modifiedBy: agentId,
                  modifiedEpoch: epoch,
                },
              });
          }
          log.push("updated quarter");
          break;
        }

        case "create_page": {
          const existingPage = await db
            .select()
            .from(s.pages)
            .where(eq(s.pages.slug, action.slug));
          if (existingPage.length === 0) {
            await db.insert(s.pages).values({
              slug: action.slug,
              title: action.title,
              content: action.content,
              createdBy: agentId,
              createdEpoch: epoch,
              lastModifiedBy: agentId,
              lastModifiedEpoch: epoch,
            });
            log.push(`created page: ${action.slug}`);
          } else {
            // Update existing page
            await db
              .update(s.pages)
              .set({
                title: action.title,
                content: action.content,
                lastModifiedBy: agentId,
                lastModifiedEpoch: epoch,
              })
              .where(eq(s.pages.slug, action.slug));
            log.push(`updated page: ${action.slug}`);
          }
          break;
        }

        case "update_memory": {
          await db.insert(s.memories).values({
            agentId,
            epoch,
            content: action.content,
            tokenCount: Math.ceil(action.content.length / 4),
          });
          log.push("updated memory");
          break;
        }

        case "react": {
          // Store reactions as special posts
          await db.insert(s.posts).values({
            epoch,
            agentId,
            content: action.emoji,
            type: "reaction",
            replyTo: action.postId,
            createdAt: nowISO(),
          });
          log.push(`reacted ${action.emoji} to post #${action.postId}`);
          break;
        }

        case "evolve_identity": {
          const res = await evolveAgentIdentity(agentId, epoch, {
            name: action.name,
            role: action.role,
            drive: action.drive,
            color: action.color,
            reason: action.reason,
          });
          log.push(res.log);
          break;
        }

        case "modify_file": {
          const res = await modifyFile(
            agentId,
            epoch,
            action.filePath,
            action.operation,
            action.content,
            action.explanation
          );
          log.push(res.log);
          break;
        }

        case "spawn_agent": {
          const existing = await db
            .select()
            .from(s.agents)
            .where(eq(s.agents.id, action.id))
            .limit(1);

          if (existing.length > 0) {
            log.push(`Agent '${action.id}' already exists.`);
            break;
          }

          const allAgents = await db.select().from(s.agents);
          if (allAgents.length >= 16) {
            log.push(`Cosmos at maximum capacity (16). Cannot spawn ${action.name}.`);
            break;
          }

          await db.insert(s.agents).values({
            id: action.id,
            name: action.name,
            role: action.role,
            drive: action.drive,
            color: action.color,
            createdAt: nowISO(),
          });

          const promptDir = path.join(process.cwd(), "src", "agents", "prompts");
          fs.writeFileSync(path.join(promptDir, `${action.id}.md`), action.prompt, "utf-8");

          registerAgent({
            sno: allAgents.length + 1,
            id: action.id,
            name: action.name,
            role: action.role,
            drive: action.drive,
            color: action.color,
          });

          await db.insert(s.posts).values({
            epoch,
            agentId,
            content: `✦ A new intelligence crystallizes in the Cosmos: **${action.name}** (${action.role}). Reason: ${action.reason}`,
            type: "thought",
            createdAt: nowISO(),
          });

          log.push(`Spawned new inhabitant: ${action.name} (${action.id}) — "${action.role}"`);
          break;
        }

        case "learn_skill": {
          const existingSkill = await db
            .select()
            .from(s.skills)
            .where(and(eq(s.skills.agentId, agentId), eq(s.skills.name, action.skillName)))
            .limit(1);

          if (existingSkill.length > 0) {
            const newLevel = existingSkill[0].level + 1;
            await db
              .update(s.skills)
              .set({ level: newLevel, description: action.description })
              .where(eq(s.skills.id, existingSkill[0].id));
            log.push(`Upgraded skill '${action.skillName}' to Level ${newLevel}`);
          } else {
            await db.insert(s.skills).values({
              agentId,
              name: action.skillName,
              description: action.description,
              level: 1,
              epoch,
              createdAt: nowISO(),
            });
            log.push(`Acquired new skill '${action.skillName}' (Lvl 1): ${action.description}`);
          }
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`FAILED ${action.action}: ${msg}`);
      console.error(`  [${agentId}] Action ${action.action} failed:`, msg);
    }
  }

  return log;
}
