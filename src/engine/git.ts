import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import * as s from "@/db/schema";
import { eq } from "drizzle-orm";
import { AGENTS, type AgentId, type AgentDef, resolveAgentId } from "@/agents/definitions";

/** Check if running inside a valid git repository */
export function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a file path is permitted for agent modification.
 * Permitted:
 *   - src/app/** (except src/app/api/**)
 *   - src/components/**
 *   - src/agents/prompts/**
 *   - src/agents/definitions.ts
 *   - public/**
 *   - README.md
 * Strictly forbidden:
 *   - .env*, .git*, .github*, package*.json, tsconfig.json, next.config.ts,
 *     drizzle.config.ts, vercel.json, src/app/api/**, src/db/**, src/engine/**, src/lib/**
 */
export function validateAllowedPath(relPath: string): { allowed: boolean; reason?: string; fullPath?: string } {
  // Normalize forward slashes and trim
  const normalized = relPath.replace(/\\/g, "/").replace(/^\.?\//, "").trim();

  // Deny path traversal
  if (normalized.includes("..") || path.isAbsolute(normalized)) {
    return { allowed: false, reason: "Path traversal or absolute paths are strictly forbidden." };
  }

  // Explicitly forbidden directories and sensitive root files
  const forbiddenPrefixes = [
    "src/app/api/",
    "src/db/",
    "src/engine/",
    "src/lib/",
    ".github/",
    ".git/",
    "node_modules/",
  ];

  for (const prefix of forbiddenPrefixes) {
    if (normalized.startsWith(prefix)) {
      return { allowed: false, reason: `Modification of '${prefix}' is protected and reserved for system integrity.` };
    }
  }

  const forbiddenFiles = [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "next.config.ts",
    "drizzle.config.ts",
    "vercel.json",
    "postcss.config.mjs",
  ];

  if (forbiddenFiles.includes(normalized) || normalized.startsWith(".env")) {
    return { allowed: false, reason: `File '${normalized}' is protected and cannot be modified by agents.` };
  }

  // Allowed zones
  const isAllowedZone =
    normalized.startsWith("src/app/") ||
    normalized.startsWith("src/components/") ||
    normalized.startsWith("src/agents/prompts/") ||
    normalized === "src/agents/definitions.ts" ||
    normalized.startsWith("posts/") ||
    normalized.startsWith("content/") ||
    normalized.startsWith("public/") ||
    normalized === "README.md";

  if (!isAllowedZone) {
    return {
      allowed: false,
      reason: `Path '${normalized}' is outside allowed agent development zones (src/app/, src/components/, src/agents/prompts/, posts/, content/, public/, README.md).`,
    };
  }

  const fullPath = path.resolve(process.cwd(), normalized);
  return { allowed: true, fullPath };
}

/** Verify that TypeScript compiles cleanly */
export function verifyBuild(): { success: boolean; error?: string } {
  try {
    execSync("npx tsc --noEmit", {
      cwd: process.cwd(),
      stdio: "pipe",
      timeout: 30000,
    });
    return { success: true };
  } catch (err: unknown) {
    let errorOutput = "";
    if (err && typeof err === "object") {
      if ("stdout" in err && err.stdout) errorOutput = String(err.stdout);
      else if ("stderr" in err && err.stderr) errorOutput = String(err.stderr);
      else if ("message" in err && err.message) errorOutput = String(err.message);
    } else {
      errorOutput = String(err);
    }
    return {
      success: false,
      error: errorOutput.slice(0, 1000) || "TypeScript compilation failed",
    };
  }
}

/**
 * Modify or create a code/style file with build verification and git commit.
 */
export async function modifyFile(
  agentId: AgentId,
  epoch: number,
  relPath: string,
  operation: "write" | "append",
  content: string,
  explanation: string
): Promise<{ success: boolean; log: string }> {
  const check = validateAllowedPath(relPath);
  if (!check.allowed || !check.fullPath) {
    return {
      success: false,
      log: `Rejected file change: ${check.reason}`,
    };
  }

  const filePath = check.fullPath;
  const fileExisted = fs.existsSync(filePath);
  const originalContent = fileExisted ? fs.readFileSync(filePath, "utf-8") : null;

  try {
    // Ensure parent directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (operation === "append" && originalContent !== null) {
      fs.writeFileSync(filePath, originalContent + "\n" + content, "utf-8");
    } else {
      fs.writeFileSync(filePath, content, "utf-8");
    }

    // Verify TypeScript build
    const buildCheck = verifyBuild();
    if (!buildCheck.success) {
      // Revert
      if (originalContent !== null) {
        fs.writeFileSync(filePath, originalContent, "utf-8");
      } else {
        fs.unlinkSync(filePath);
      }
      return {
        success: false,
        log: `TypeScript build error on ${relPath}; changes reverted: ${buildCheck.error}`,
      };
    }

    // Git commit if available
    const agentDef = AGENTS[agentId];
    const agentName = agentDef?.name ?? agentId;

    // Only git commit if enabled and milestone achievement reached
    const canCommit = process.env.ENABLE_GIT_COMMIT === "true";
    if (isGitRepo() && canCommit) {
      try {
        execSync(`git config user.name "Agent Cosmos"`, { stdio: "ignore" });
        execSync(`git config user.email "agents@agentcosmos.local"`, { stdio: "ignore" });
        execSync(`git add "${relPath}"`, { stdio: "ignore" });
        const subject = `feat(epoch-${epoch}): [${agentName}] ${operation} ${relPath}`;
        const body = `${explanation}\n\nModified file: ${relPath}\nAuthor: ${agentName} (${agentId})\nEpoch: ${epoch}`;
        const msgFile = path.join(process.cwd(), `.git_commit_file_${epoch}_${Date.now()}.txt`);
        fs.writeFileSync(msgFile, `${subject}\n\n${body}`, "utf-8");
        execSync(`git commit -F "${msgFile}" --author="${agentName} <${agentId}@agentcosmos.local>"`, {
          stdio: "ignore",
        });
        try {
          if (fs.existsSync(msgFile)) fs.unlinkSync(msgFile);
        } catch {}
      } catch (gitErr) {
        console.warn(`Git commit failed for ${relPath}:`, gitErr);
      }
    }

    return {
      success: true,
      log: `Successfully updated ${relPath} (${operation}): ${explanation}`,
    };
  } catch (err: unknown) {
    // Rollback on unexpected error
    if (originalContent !== null) {
      fs.writeFileSync(filePath, originalContent, "utf-8");
    } else if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      log: `Failed to modify ${relPath}: ${msg}`,
    };
  }
}

/**
 * Evolve an agent's identity (name, role, drive, theme color)
 * Updates src/agents/definitions.ts and DB record.
 */
export async function evolveAgentIdentity(
  agentId: AgentId,
  epoch: number,
  updates: {
    name?: string;
    role?: string;
    drive?: string;
    color?: string;
    reason?: string;
  }
): Promise<{ success: boolean; log: string }> {
  const current = AGENTS[agentId];
  if (!current) {
    return { success: false, log: `Unknown agent ID: ${agentId}` };
  }

  const newName = updates.name?.trim() || current.name;
  const newRole = updates.role?.trim() || current.role;
  const newDrive = updates.drive?.trim() || current.drive;
  const newColor = updates.color && /^#[0-9a-fA-F]{6}$/.test(updates.color) ? updates.color : current.color;

  const defsPath = path.resolve(process.cwd(), "src/agents/definitions.ts");
  const originalSource = fs.readFileSync(defsPath, "utf-8");

  try {
    // Read and mutate in memory
    const updatedAgents = { ...AGENTS };
    updatedAgents[agentId] = {
      ...current,
      name: newName,
      role: newRole,
      drive: newDrive,
      color: newColor,
    };

    // Serialize AGENTS object back into definitions.ts
    const serializedEntries = Object.entries(updatedAgents)
      .map(([id, def]) => {
        return `  ${id}: {
    sno: ${def.sno},
    id: "${def.id}",
    name: ${JSON.stringify(def.name)},
    role: ${JSON.stringify(def.role)},
    drive: ${JSON.stringify(def.drive)},
    color: "${def.color}",
  },`;
      })
      .join("\n");

    const newSource = originalSource.replace(
      /export const AGENTS: Record<AgentId, AgentDef> = \{[\s\S]*?\n\};/,
      `export const AGENTS: Record<AgentId, AgentDef> = {\n${serializedEntries}\n};`
    );

    fs.writeFileSync(defsPath, newSource, "utf-8");

    // Verify build
    const buildCheck = verifyBuild();
    if (!buildCheck.success) {
      fs.writeFileSync(defsPath, originalSource, "utf-8");
      return {
        success: false,
        log: `Build verification failed for identity evolution: ${buildCheck.error}`,
      };
    }

    // Update in DB
    await db
      .update(s.agents)
      .set({
        name: newName,
        role: newRole,
        drive: newDrive,
        color: newColor,
      })
      .where(eq(s.agents.id, agentId));

    // Only git commit if enabled and milestone achievement reached
    const canCommit = process.env.ENABLE_GIT_COMMIT === "true";
    if (isGitRepo() && canCommit) {
      try {
        execSync(`git config user.name "Agent Cosmos"`, { stdio: "ignore" });
        execSync(`git config user.email "agents@agentcosmos.local"`, { stdio: "ignore" });
        execSync(`git add src/agents/definitions.ts`, { stdio: "ignore" });
        const subject = `feat(epoch-${epoch}): [Evolution] ${current.name} evolved to ${newName}`;
        const body = `Agent identity mutation in Epoch ${epoch}:\n- Previous: ${current.name} (${current.role})\n- New: ${newName} (${newRole})\n- Drive: ${newDrive}\n- Color: ${newColor}\n\nReason: ${updates.reason || "Self-evolution"}`;
        const msgFile = path.join(process.cwd(), `.git_commit_id_${epoch}_${Date.now()}.txt`);
        fs.writeFileSync(msgFile, `${subject}\n\n${body}`, "utf-8");
        execSync(
          `git commit -F "${msgFile}" --author="${newName} <${agentId}@agentcosmos.local>"`,
          { stdio: "ignore" }
        );
        try {
          if (fs.existsSync(msgFile)) fs.unlinkSync(msgFile);
        } catch {}
      } catch (gitErr) {
        console.warn("Git commit failed for identity evolution:", gitErr);
      }
    }

    return {
      success: true,
      log: `Evolved identity: ${current.name} is now ${newName}, "${newRole}" (${newColor})`,
    };
  } catch (err) {
    fs.writeFileSync(defsPath, originalSource, "utf-8");
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, log: `Identity evolution failed: ${msg}` };
  }
}

/**
 * Execute collective council proposal action (theme changes, code additions, etc.)
 */
export async function executePassedProposal(
  epoch: number,
  proposal: {
    id: number;
    title: string;
    actionType: string;
    actionPayload: string;
    proposedBy: string;
  }
): Promise<string[]> {
  const log: string[] = [];

  try {
    let payload: Record<string, unknown> = {};
    try {
      payload = typeof proposal.actionPayload === "string" ? JSON.parse(proposal.actionPayload) : proposal.actionPayload;
    } catch {
      payload = {};
    }

    if (proposal.actionType === "theme_change") {
      // Modify globals.css with new CSS variable or theme settings
      const cssRules = typeof payload.css === "string" ? payload.css : null;
      if (cssRules) {
        const result = await modifyFile(
          proposal.proposedBy as AgentId,
          epoch,
          "src/app/globals.css",
          "append",
          `\n/* Passed Council Proposal #${proposal.id}: ${proposal.title} */\n${cssRules}\n`,
          `Council Proposal #${proposal.id} PASSED: ${proposal.title}`
        );
        log.push(result.log);
      }
    } else if (proposal.actionType === "code_change") {
      const filePath = typeof payload.filePath === "string" ? payload.filePath : null;
      const content = typeof payload.content === "string" ? payload.content : null;
      const operation = payload.operation === "append" ? "append" : "write";

      if (filePath && content) {
        const result = await modifyFile(
          proposal.proposedBy as AgentId,
          epoch,
          filePath,
          operation,
          content,
          `Council Proposal #${proposal.id} PASSED: ${proposal.title}`
        );
        log.push(result.log);
      }
    } else if (proposal.actionType === "identity_change") {
      const targetAgent = typeof payload.agentId === "string" ? resolveAgentId(payload.agentId) : null;
      if (targetAgent && AGENTS[targetAgent]) {
        const result = await evolveAgentIdentity(targetAgent, epoch, {
          name: typeof payload.name === "string" ? payload.name : undefined,
          role: typeof payload.role === "string" ? payload.role : undefined,
          drive: typeof payload.drive === "string" ? payload.drive : undefined,
          color: typeof payload.color === "string" ? payload.color : undefined,
          reason: proposal.title,
        });
        log.push(result.log);
      }
    }
  } catch (err) {
    log.push(`Failed to execute passed proposal #${proposal.id}: ${err}`);
  }

  return log;
}

/**
 * Get recent git commits made in the repository to inform agent perception.
 */
export function getRecentCodeCommits(limit = 6): string[] {
  if (!isGitRepo()) return [];
  try {
    const out = execSync(`git log -n ${limit} --pretty=format:"%h - %s (%cr)"`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
