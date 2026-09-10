import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { runEpoch } from "./cycle";
import { db } from "@/db";
import * as s from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { AGENTS, AGENT_IDS } from "@/agents/definitions";
import { config } from "@/lib/config";
import { runAgy } from "@/lib/agy";
import { runOmp } from "@/lib/omp";
interface RunnerArgs {
  once: boolean;
  intervalMinutes: number;
  verbose: boolean;
  push: boolean;
}

function parseArgs(): RunnerArgs {
  const args = process.argv.slice(2);
  let once = false;
  let intervalMinutes = 60; // default 1 hour timely trigger
  let verbose = false;
  let push = true;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--once" || arg === "-1") {
      once = true;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (arg === "--interval" || arg === "-i") {
      const next = args[i + 1];
      if (next && !isNaN(Number(next))) {
        intervalMinutes = Math.max(1, Number(next));
        i++;
      }
    } else if (arg === "--no-push") {
      push = false;
    } else if (arg === "--push") {
      push = true;
    }
  }

  return { once, intervalMinutes, verbose, push };
}

function printBanner() {
  console.clear();
  console.log(`
\x1b[36m╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║                    ✦  A G E N T   C O S M O S  ✦                         ║
║                                                                          ║
║           Autonomous Living Ecosystem Powered by Antigravity CLI        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
}

async function verifyCognitiveConnection(): Promise<{ ok: boolean; message: string }> {
  if (config.llm.useAgy) {
    try {
      const testResult = await runAgy({
        prompt: "Reply with the single word: READY",
        effort: "low",
        timeoutMs: 35000,
      });

      if (testResult.toLowerCase().includes("ready")) {
        return { ok: true, message: "Antigravity CLI (agy): ONLINE & READY (unlimited folder access enabled)" };
      }
      return { ok: true, message: `Antigravity CLI (agy) Connected: "${testResult.slice(0, 35)}..."` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Antigravity CLI (agy) Warning: ${msg}` };
    }
  }

  if (config.llm.useOmp) {
    try {
      const testResult = await runOmp({
        prompt: "Reply with the single word: READY",
        thinking: "minimal",
        timeoutMs: 25000,
      });

      if (testResult.toLowerCase().includes("ready")) {
        return { ok: true, message: "OMP Cognitive Engine: ONLINE & READY" };
      }
      return { ok: true, message: `OMP Engine Connected: "${testResult.slice(0, 30)}..."` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `OMP Engine Warning: ${msg}` };
    }
  }

  return { ok: true, message: "External API Key Providers Configured" };
}

async function printWorldStatus() {
  const [lastEpoch] = await db
    .select()
    .from(s.epochs)
    .orderBy(desc(s.epochs.number))
    .limit(1);

  const [postCount] = await db.select({ value: count() }).from(s.posts);
  const [proposalCount] = await db.select({ value: count() }).from(s.proposals);
  const [pageCount] = await db.select({ value: count() }).from(s.pages);

  console.log("\x1b[1m── World Diagnostics ──\x1b[0m");
  console.log(`  Current Epoch   : \x1b[33m${lastEpoch?.number ?? 0}\x1b[0m`);
  console.log(`  Agora Posts     : \x1b[32m${postCount?.value ?? 0}\x1b[0m`);
  console.log(`  Council Motions : \x1b[35m${proposalCount?.value ?? 0}\x1b[0m`);
  console.log(`  Agent Pages     : \x1b[34m${pageCount?.value ?? 0}\x1b[0m`);
  console.log(`  Active Inhabitants (${AGENT_IDS.length}):`);
  
  for (const id of AGENT_IDS) {
    const def = AGENTS[id];
    console.log(`    \x1b[38;2;150;150;250m•\x1b[0m \x1b[1m${def.name.padEnd(10)}\x1b[0m (${def.role}) — \x1b[90m${def.drive}\x1b[0m`);
  }
  console.log();
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

async function countdown(seconds: number): Promise<void> {
  for (let rem = seconds; rem > 0; rem--) {
    const mins = Math.floor(rem / 60);
    const secs = rem % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    process.stdout.write(`\r\x1b[90m[Next Awakening in: \x1b[36m${timeStr}\x1b[90m | Press Ctrl+C to exit]\x1b[0m `);
    await sleep(1000);
  }
  process.stdout.write("\r" + " ".repeat(60) + "\r");
}
function cleanSummaryForCommit(raw?: string): { headline: string; body: string } {
  if (!raw) {
    return {
      headline: "Autonomous evolution milestone",
      body: "Autonomous evolution cycle completed across active inhabitants.",
    };
  }

  let cleaned = raw.trim();

  // Strip code fences
  cleaned = cleaned.replace(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/g, "$1").trim();

  // Handle JSON
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleaned);
      cleaned = parsed.thought || parsed.summary || parsed.content || parsed.post || cleaned;
    } catch {
      const match = cleaned.match(/"(?:thought|summary|content|post)"\s*:\s*"([^"]+)"/);
      if (match) {
        cleaned = match[1];
      }
    }
  }

  cleaned = cleaned.replace(/\\"/g, '"').replace(/\\n/g, "\n").trim();

  // Generate headline from first sentence or up to 65 chars
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() || cleaned;
  const headline = firstSentence.length > 68
    ? firstSentence.slice(0, 65).trim() + "..."
    : firstSentence || "Autonomous evolution milestone";

  return { headline, body: cleaned };
}

async function syncMilestoneToGit(epoch: number, epochLog: string[] = []): Promise<boolean> {
  try {
    const statusRaw = execSync("git status --porcelain", { encoding: "utf-8" }).trim();

    if (!statusRaw) {
      console.log(`\x1b[90m[Git] Working tree clean; no new substrate changes to commit for Epoch ${epoch}.\x1b[0m`);
      return true;
    }

    // Parse changed file paths
    const rawFiles = statusRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.slice(2).trim());

    const hasSubstrateFileChanges = rawFiles.some(
      (f) => f !== "world.db" && !f.startsWith(".git_commit_msg")
    );

    const hasMajorMilestone = epochLog.some(
      (l) =>
        l.includes("Successfully updated") ||
        l.includes("Spawned new inhabitant") ||
        (l.includes("proposal") && l.includes("passed"))
    );

    // Only commit when a tangible substrate milestone, code, or blog artifact was achieved
    if (!hasSubstrateFileChanges && !hasMajorMilestone) {
      console.log(`\x1b[90m[Git] Routine epoch dialogue; skipping commit until tangible substrate milestones are achieved.\x1b[0m`);
      return true;
    }
    // Parse status lines
    const changedFiles = statusRaw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const type = l.slice(0, 2).trim();
        const file = l.slice(2).trim();
        const label =
          type === "M" ? "Modified" :
          type === "A" || type === "??" ? "Added" :
          type === "D" ? "Deleted" :
          type === "R" ? "Renamed" : "Updated";
        return `- ${label}: ${file}`;
      });

    // Extract raw summary from log
    const summaryLine = epochLog.find((l) => l.startsWith("  Summary:"))?.replace("  Summary: ", "");
    const { headline, body } = cleanSummaryForCommit(summaryLine);

    // Extract agent milestones from epochLog
    const agentMilestones: string[] = [];
    for (const line of epochLog) {
      if (line.includes("Acquired new skill") || line.includes("Upgraded skill")) {
        agentMilestones.push(line.replace(/^\s*→\s*/, "- "));
      } else if (line.includes("Successfully updated")) {
        agentMilestones.push(line.replace(/^\s*→\s*/, "- "));
      } else if (line.includes("Spawned new inhabitant")) {
        agentMilestones.push(line.replace(/^\s*→\s*/, "- "));
      } else if (line.includes("proposal") && line.includes("passed")) {
        agentMilestones.push(line.replace(/^\s*/, "- "));
      }
    }

    // Construct detailed multi-line commit message
    const lines: string[] = [
      `epoch ${epoch}: [Agent Cosmos] ${headline}`,
      "",
      body || `Autonomous evolution milestone for Epoch ${epoch}.`,
    ];

    if (changedFiles.length > 0) {
      lines.push("", "Substrate & File Modifications:");
      for (const f of changedFiles) {
        lines.push(f);
      }
    }

    if (agentMilestones.length > 0) {
      lines.push("", "Agent Milestones:");
      for (const m of agentMilestones.slice(0, 12)) {
        lines.push(m);
      }
    }

    const fullCommitMessage = lines.join("\n");

    // Write to temporary commit message file for git commit -F
    const msgFile = path.join(process.cwd(), `.git_commit_msg_${epoch}_${Date.now()}.txt`);
    fs.writeFileSync(msgFile, fullCommitMessage, "utf-8");

    execSync(`git config user.name "Agent Cosmos"`, { stdio: "ignore" });
    execSync(`git config user.email "agents@agentcosmos.local"`, { stdio: "ignore" });
    execSync("git add .", { stdio: "ignore" });
    execSync(`git commit -F "${msgFile}"`, { stdio: "ignore" });

    try {
      if (fs.existsSync(msgFile)) fs.unlinkSync(msgFile);
    } catch {}

    console.log(`\x1b[32m✔ [Git] Milestone committed with detailed description for Epoch ${epoch}.\x1b[0m`);
    console.log(`\x1b[36m[Git] Pushing Epoch ${epoch} milestone to origin main...\x1b[0m`);
    execSync("git push origin main", { stdio: "pipe", timeout: 60000 });
    console.log(`\x1b[32m✔ [Git] Successfully pushed to origin main.\x1b[0m`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`\x1b[33m⚠ [Git] Sync/Push warning:\x1b[0m ${msg}`);
    return false;
  }
}


async function main() {
  const opts = parseArgs();
  printBanner();

  console.log("\x1b[90mInitializing cognitive substrate bridge...\x1b[0m");
  const cognitiveStatus = await verifyCognitiveConnection();
  if (cognitiveStatus.ok) {
    console.log(`\x1b[32m✔ ${cognitiveStatus.message}\x1b[0m\n`);
  } else {
    console.log(`\x1b[33m⚠ ${cognitiveStatus.message}\x1b[0m\n`);
  }

  await printWorldStatus();

  if (opts.once) {
    console.log("\x1b[1m\x1b[36mInitiating Single Awakening Cycle...\x1b[0m\n");
    const result = await runEpoch();
    console.log(result.log.join("\n"));
    console.log(`\n\x1b[32m✔ Epoch ${result.epoch} completed successfully.\x1b[0m`);
    process.exit(0);
  }

  console.log(`\x1b[36mAutonomous Timely Mode Enabled:\x1b[0m Accelerated cadence: \x1b[1m60–180 seconds\x1b[0m. Auto-push: \x1b[1m${opts.push ? "ENABLED" : "DISABLED"}\x1b[0m.\n`);

  let cycleCount = 0;
  while (true) {
    cycleCount++;
    console.log(`\n\x1b[1m\x1b[35m══════════ Awakening Cycle #${cycleCount} ══════════\x1b[0m`);
    const startTime = Date.now();

    try {
      const result = await runEpoch();
      console.log(result.log.join("\n"));
      const durationSec = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n\x1b[32m✔ Epoch ${result.epoch} concluded in ${durationSec}s.\x1b[0m`);

      if (opts.push) {
        console.log(`\n\x1b[1m── Git Synchronization ──\x1b[0m`);
        await syncMilestoneToGit(result.epoch, result.log);
      }
      console.log();
    } catch (err) {
      console.error(`\x1b[31m✖ Epoch execution encountered an issue:\x1b[0m`, err);
    }

    // Accelerated evolutionary cadence: 60 to 180 seconds gap between epochs
    const chosenSeconds = Math.floor(Math.random() * 121) + 60; // 60 to 180 seconds (1 to 3 minutes)
    const mins = Math.floor(chosenSeconds / 60);
    const secs = chosenSeconds % 60;
    const readableTime = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    console.log(`\x1b[90mAgents entering brief dormancy for \x1b[36m${readableTime}\x1b[90m (accelerated evolutionary cadence: 60–180s)...\x1b[0m`);
    await countdown(chosenSeconds);
  }
}

main().catch((err) => {
  console.error("\x1b[31mFatal error in Agent Cosmos runner:\x1b[0m", err);
  process.exit(1);
});
