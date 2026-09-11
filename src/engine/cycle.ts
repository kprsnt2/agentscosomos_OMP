import { db } from "@/db";
import * as s from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AGENT_IDS, registerAgent, type AgentId } from "@/agents/definitions";
import { nowISO, shuffle } from "@/lib/utils";
import { buildContext } from "./perceive";
import { think } from "./think";
import { executeActions } from "./act";
import {
  resolveProposals,
  updateRelationships,
  summarizeEpoch,
  markSuggestionsRead,
} from "./resolve";
import { compactMemory } from "./memory";

export async function runEpoch(): Promise<{
  epoch: number;
  log: string[];
}> {
  const log: string[] = [];

  // Determine epoch number
  const lastEpoch = await db
    .select()
    .from(s.epochs)
    .orderBy(desc(s.epochs.number))
    .limit(1);
  const epoch = (lastEpoch[0]?.number ?? 0) + 1;

  log.push(`═══ EPOCH ${epoch} BEGINS ═══`);
  log.push(`Started at ${nowISO()}`);

  // Dynamically sync all active agents from database
  const dbAgents = await db.select().from(s.agents);
  for (let i = 0; i < dbAgents.length; i++) {
    const a = dbAgents[i];
    registerAgent({
      sno: i + 1,
      id: a.id,
      name: a.name,
      role: a.role,
      drive: a.drive,
      color: a.color,
    });
  }

  // Randomize agent order with all active inhabitants
  const agentOrder = shuffle([...AGENT_IDS]);
  log.push(`Active inhabitants: ${AGENT_IDS.length} (${AGENT_IDS.join(", ")})`);
  log.push(`Agent turn order: ${agentOrder.join(", ")}`);

  // Record epoch start
  await db.insert(s.epochs).values({
    number: epoch,
    startedAt: nowISO(),
    agentOrder: JSON.stringify(agentOrder),
  });

  // Compact memories before perception
  log.push("\n── Memory Compaction ──");
  for (const agentId of agentOrder) {
    await compactMemory(agentId);
  }

  // Run each agent
  for (const agentId of agentOrder) {
    log.push(`\n── ${agentId.toUpperCase()} awakens ──`);

    try {
      // 1. Perceive
      const ctx = await buildContext(agentId, epoch);
      log.push(`  Perception: ${ctx.recentPosts.length} posts, ${ctx.inbox.length} messages, ${ctx.activeProposals.length} proposals`);

      // 2. Think
      const turn = await think(ctx);
      if (turn.thinking) {
        log.push(`  Thinking: ${turn.thinking.slice(0, 100)}...`);
      }
      log.push(`  Actions planned: ${turn.actions.length}`);

      // 3. Act
      const actionLog = await executeActions(agentId, epoch, turn.actions);
      for (const entry of actionLog) {
        log.push(`  → ${entry}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`  ERROR: ${msg}`);
      console.error(`[cycle] Agent ${agentId} failed: ${msg}`);
      
      const isQuotaOrNetwork = /quota|rate limit|429|wsarecv|eligibility|timeout/i.test(msg);
      if (isQuotaOrNetwork) {
        log.push(`  [Quota Protection] Rate limit or provider connection detected; pausing 15s before next turn...`);
        await new Promise((r) => setTimeout(r, 15000));
      }
      // Continue with next agent — one failure shouldn't stop the epoch
    }
  }

  // Post-cycle resolution
  log.push("\n── Resolution ──");

  const proposalLog = await resolveProposals(epoch);
  for (const entry of proposalLog) {
    log.push(`  ${entry}`);
  }

  await updateRelationships(epoch);
  log.push("  Relationships updated");

  await markSuggestionsRead();

  // Generate epoch summary
  const summary = await summarizeEpoch(epoch);
  log.push(`  Summary: ${summary}`);

  // Complete epoch record
  await db
    .update(s.epochs)
    .set({
      completedAt: nowISO(),
      summary,
    })
    .where(eq(s.epochs.number, epoch));

  log.push(`\n═══ EPOCH ${epoch} COMPLETE ═══`);

  return { epoch, log };
}
