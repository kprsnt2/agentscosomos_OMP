import { db } from "@/db";
import * as s from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { AGENT_IDS } from "@/agents/definitions";
import { config } from "@/lib/config";
import { complete } from "@/lib/llm";
import { parseJSON } from "@/lib/utils";

/** Resolve proposals: tally votes, pass/reject/expire */
export async function resolveProposals(epoch: number): Promise<string[]> {
  const log: string[] = [];

  const active = await db
    .select()
    .from(s.proposals)
    .where(eq(s.proposals.status, "active"));

  for (const proposal of active) {
    // Check expiry
    if (epoch >= proposal.expiresEpoch) {
      await db
        .update(s.proposals)
        .set({ status: "expired" })
        .where(eq(s.proposals.id, proposal.id));
      log.push(`Proposal #${proposal.id} "${proposal.title}" expired`);
      continue;
    }

    // Tally votes
    const pVotes = await db
      .select()
      .from(s.votes)
      .where(eq(s.votes.proposalId, proposal.id));

    if (pVotes.length >= config.quorum) {
      const yesCount = pVotes.filter((v) => v.vote === "yes").length;
      const noCount = pVotes.filter((v) => v.vote === "no").length;

      if (yesCount > noCount) {
        await db
          .update(s.proposals)
          .set({ status: "passed" })
          .where(eq(s.proposals.id, proposal.id));
        log.push(`Proposal #${proposal.id} "${proposal.title}" PASSED (${yesCount}Y/${noCount}N)`);
        // TODO: Execute passed proposal actions (theme changes, etc.)
      } else {
        await db
          .update(s.proposals)
          .set({ status: "rejected" })
          .where(eq(s.proposals.id, proposal.id));
        log.push(`Proposal #${proposal.id} "${proposal.title}" REJECTED (${yesCount}Y/${noCount}N)`);
      }
    }
  }

  return log;
}

/** Update relationship scores based on epoch interactions */
export async function updateRelationships(epoch: number): Promise<void> {
  // Gather interactions from this epoch
  const epochPosts = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.epoch, epoch));

  const epochMessages = await db
    .select()
    .from(s.messages)
    .where(eq(s.messages.epoch, epoch));

  // Track interaction pairs
  const interactions = new Map<string, number>();
  const pairKey = (a: string, b: string) => [a, b].sort().join(":");

  // Replies in agora = interaction
  for (const post of epochPosts) {
    if (post.replyTo) {
      const parent = epochPosts.find((p) => p.id === post.replyTo);
      if (parent && parent.agentId !== post.agentId) {
        const key = pairKey(post.agentId, parent.agentId);
        interactions.set(key, (interactions.get(key) ?? 0) + 1);
      }
    }
  }

  // DMs = interaction
  for (const msg of epochMessages) {
    if (msg.fromAgent !== msg.toAgent) {
      const key = pairKey(msg.fromAgent, msg.toAgent);
      interactions.set(key, (interactions.get(key) ?? 0) + 1);
    }
  }

  // Upsert relationship records
  for (const [key, count] of interactions) {
    const [agentA, agentB] = key.split(":");
    if (!agentA || !agentB) continue;

    const existing = await db
      .select()
      .from(s.relationships)
      .where(
        and(
          eq(s.relationships.agentA, agentA),
          eq(s.relationships.agentB, agentB)
        )
      );

    if (existing.length > 0) {
      const row = existing[0]!;
      await db
        .update(s.relationships)
        .set({
          interactionCount: row.interactionCount + count,
          lastEpoch: epoch,
          // Sentiment drifts slightly positive with interaction (can be overridden)
          sentiment: Math.min(1, row.sentiment + 0.05 * count),
        })
        .where(eq(s.relationships.id, row.id));
    } else {
      await db.insert(s.relationships).values({
        agentA,
        agentB,
        sentiment: 0.1,
        interactionCount: count,
        lastEpoch: epoch,
        notes: "",
      });
    }
  }
}

/** Generate epoch summary using LLM */
export async function summarizeEpoch(epoch: number): Promise<string> {
  const posts = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.epoch, epoch));

  const proposals = await db
    .select()
    .from(s.proposals)
    .where(eq(s.proposals.epoch, epoch));

  if (posts.length === 0 && proposals.length === 0) {
    return "A silent epoch. Nothing stirred.";
  }

  const postSummary = posts
    .filter((p) => p.type !== "reaction")
    .map((p) => `${p.agentId}: ${p.content.slice(0, 200)}`)
    .join("\n");

  const proposalSummary = proposals
    .map((p) => `${p.proposedBy} proposed "${p.title}" (${p.status})`)
    .join("\n");

  try {
    const result = await complete({
      system: "You are a concise chronicler. Summarize the epoch's events in 2-3 sentences. Be factual and evocative. No markdown.",
      prompt: `Epoch ${epoch} activity:\n\nPosts:\n${postSummary}\n\nProposals:\n${proposalSummary}`,
      temperature: 0.7,
      maxTokens: 200,
    });
    return result.content;
  } catch {
    // Fallback if LLM fails
    return `Epoch ${epoch}: ${posts.length} posts, ${proposals.length} proposals.`;
  }
}

/** Mark admin suggestions as read after an epoch */
export async function markSuggestionsRead(): Promise<void> {
  await db
    .update(s.suggestions)
    .set({ read: true })
    .where(eq(s.suggestions.read, false));
}
