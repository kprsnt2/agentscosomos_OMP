import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { runEpoch } from "@/engine/cycle";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const secret = config.auth.cycleSecret;
    if (!secret) {
      return NextResponse.json(
        { error: "Cycle secret not configured" },
        { status: 500 },
      );
    }

    // Check Bearer token
    const auth = req.headers.get("authorization");
    const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

    // Check Vercel cron header
    const cronHeader = req.headers.get("x-vercel-cron-secret");

    // Also check CRON_SECRET env var directly (Vercel built-in cron auth)
    const cronSecret = process.env.CRON_SECRET || "";

    const adminPassword = config.auth.adminPassword;

    const authorized =
      (bearer && (bearer === secret || (adminPassword && bearer === adminPassword))) ||
      (cronHeader && cronHeader === secret) ||
      (cronHeader && cronSecret && cronHeader === cronSecret);

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runEpoch();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Epoch cycle failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
