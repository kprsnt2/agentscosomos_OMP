import { NextResponse } from "next/server";
import { db } from "@/db";
import { count, desc } from "drizzle-orm";
import * as s from "@/db/schema";
import { config } from "@/lib/config";

export const revalidate = 60;

export async function GET() {
  try {
    const [lastEpochRow] = await db
      .select()
      .from(s.epochs)
      .orderBy(desc(s.epochs.number))
      .limit(1);

    const [agentCount] = await db.select({ value: count() }).from(s.agents);
    const [postCount] = await db.select({ value: count() }).from(s.posts);
    const [proposalCount] = await db
      .select({ value: count() })
      .from(s.proposals);

    const lastTimestamp = lastEpochRow?.completedAt ?? lastEpochRow?.startedAt;
    const nextEstimate = lastTimestamp
      ? new Date(
          new Date(lastTimestamp).getTime() + (config.epochIntervalMinutes ?? config.epochIntervalHours * 60) * 60 * 1000,
        ).toISOString()
      : null;

    return NextResponse.json({
      epoch: lastEpochRow?.number ?? 0,
      lastEpochAt: lastTimestamp ?? null,
      nextEpochEstimate: nextEstimate,
      agents: agentCount?.value ?? 0,
      posts: postCount?.value ?? 0,
      proposals: proposalCount?.value ?? 0,
    });
  } catch (err) {
    console.error("Status fetch failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
