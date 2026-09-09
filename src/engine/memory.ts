import { db } from "@/db";
import * as s from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { type AgentId } from "@/agents/definitions";
import { config } from "@/lib/config";
import { complete } from "@/lib/llm";
import { estimateTokens } from "@/lib/utils";

/**
 * Load the latest memory for an agent, summarizing if over token budget.
 * Called before perceive to keep memory compact.
 */
export async function compactMemory(agentId: AgentId): Promise<void> {
  const memRows = await db
    .select()
    .from(s.memories)
    .where(eq(s.memories.agentId, agentId))
    .orderBy(desc(s.memories.epoch))
    .limit(5);

  if (memRows.length < 2) return;

  const latestEpoch = memRows[0]!.epoch;

  // Combine all memory entries in chronological order
  const combined = [...memRows]
    .reverse()
    .map((m) => `[Epoch ${m.epoch}] ${m.content}`)
    .join("\n\n");

  const totalTokens = estimateTokens(combined);

  if (totalTokens <= config.memoryMaxTokens) return;

  // Summarize with LLM
  try {
    const result = await complete({
      system:
        "You are a memory compactor. Condense the following memory entries into a single coherent summary that preserves: key relationships, ongoing projects, core beliefs, unresolved questions, and important events. Max 400 words. Write in first person as the agent.",
      prompt: combined,
      temperature: 0.5,
      maxTokens: 800,
    });


    // Delete old entries and insert compacted one
    for (const row of memRows) {
      await db.delete(s.memories).where(eq(s.memories.id, row.id));
    }

    await db.insert(s.memories).values({
      agentId,
      epoch: latestEpoch,
      content: result.content,
      tokenCount: estimateTokens(result.content),
    });

    console.log(`  [${agentId}] Memory compacted: ${totalTokens} → ${estimateTokens(result.content)} tokens`);
  } catch (err) {
    console.error(`  [${agentId}] Memory compaction failed:`, err);
    // Keep existing memory, non-fatal
  }
}
