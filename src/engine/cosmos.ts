import { execSync } from "child_process";
import { runEpoch } from "./cycle";
import { db } from "@/db";
import * as s from "@/db/schema";
import { desc, count } from "drizzle-orm";
import { AGENTS, AGENT_IDS } from "@/agents/definitions";
import { config } from "@/lib/config";
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
║              Autonomous Living Ecosystem Powered by Oh My Pi             ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
}

async function verifyOmpConnection(): Promise<{ ok: boolean; message: string }> {
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
async function syncMilestoneToGit(epoch: number, summaryHeadline?: string): Promise<boolean> {
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();

    if (!status) {
      console.log(`\x1b[90m[Git] Working tree clean; no new substrate changes to commit for Epoch ${epoch}.\x1b[0m`);
      return true;
    }

    execSync(`git config user.name "Agent Cosmos"`, { stdio: "ignore" });
    execSync(`git config user.email "agents@agentcosmos.local"`, { stdio: "ignore" });
    execSync("git add .", { stdio: "ignore" });

    const headline = summaryHeadline
      ? summaryHeadline.slice(0, 70).replace(/[\r\n"]/g, " ")
      : `Autonomous evolution cycle`;
    const commitMsg = `epoch ${epoch}: [Agent Cosmos] ${headline}`;
    execSync(`git commit -m "${commitMsg}"`, { stdio: "ignore" });
    console.log(`\x1b[32m✔ [Git] Milestone committed: "${commitMsg}"\x1b[0m`);

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
  const ompStatus = await verifyOmpConnection();
  if (ompStatus.ok) {
    console.log(`\x1b[32m✔ ${ompStatus.message}\x1b[0m\n`);
  } else {
    console.log(`\x1b[33m⚠ ${ompStatus.message}\x1b[0m\n`);
  }

  await printWorldStatus();

  if (opts.once) {
    console.log("\x1b[1m\x1b[36mInitiating Single Awakening Cycle...\x1b[0m\n");
    const result = await runEpoch();
    console.log(result.log.join("\n"));
    console.log(`\n\x1b[32m✔ Epoch ${result.epoch} completed successfully.\x1b[0m`);
    process.exit(0);
  }

  console.log(`\x1b[36mAutonomous Timely Mode Enabled:\x1b[0m Cycles trigger every \x1b[1m${opts.intervalMinutes}\x1b[0m minutes (1 hour). Auto-push: \x1b[1m${opts.push ? "ENABLED" : "DISABLED"}\x1b[0m.\n`);

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
        await syncMilestoneToGit(result.epoch, result.log.find((l) => l.startsWith("  Summary:"))?.replace("  Summary: ", ""));
      }
      console.log();
    } catch (err) {
      console.error(`\x1b[31m✖ Epoch execution encountered an issue:\x1b[0m`, err);
    }

    console.log("\x1b[90mAgents entering dormancy...\x1b[0m");
    await countdown(opts.intervalMinutes * 60);
  }
}

main().catch((err) => {
  console.error("\x1b[31mFatal error in Agent Cosmos runner:\x1b[0m", err);
  process.exit(1);
});
