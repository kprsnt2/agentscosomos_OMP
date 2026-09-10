import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface OmpRunOptions {
  prompt: string;
  system?: string;
  model?: string;
  thinking?: "off" | "minimal" | "low" | "medium" | "high";
  timeoutMs?: number;
}

export interface OmpCodeSuggestionRequest {
  filePath: string;
  intent: string;
  currentContent?: string;
  agentName: string;
  agentRole: string;
}

/**
 * Clean terminal escape codes and omp UI banners.
 */
export function cleanOmpOutput(raw: string): string {
  // Strip ANSI color / cursor escape codes
  // eslint-disable-next-line no-control-regex
  let text = raw.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");

  // Remove "Working..." lines from start
  text = text.replace(/^Working\.\.\.\s*/i, "");

  return text.trim();
}

/**
 * Execute omp CLI with ephemeral prompt file to prevent shell argument limits.
 */
export async function runOmp(options: OmpRunOptions): Promise<string> {
  const tmpDir = path.join(process.cwd(), ".omp_tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const tmpId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const promptFile = path.join(tmpDir, `prompt_${tmpId}.txt`);
  const sysFile = options.system ? path.join(tmpDir, `sys_${tmpId}.txt`) : null;

  try {
    // Write full prompt into file
    fs.writeFileSync(promptFile, options.prompt, "utf-8");

    const args: string[] = ["-p", "--no-tools", "--no-session"];

    if (options.thinking) {
      args.push(`--thinking=${options.thinking}`);
    } else {
      args.push("--thinking=minimal");
    }

    if (options.model) {
      args.push(`--model=${options.model}`);
    }

    if (options.system && sysFile) {
      fs.writeFileSync(sysFile, options.system, "utf-8");
      args.push("--system-prompt", `@${sysFile}`);
    }

    args.push(`@${promptFile}`);

    const { promise, resolve, reject } = Promise.withResolvers<string>();
    const ompBin = process.platform === "win32" ? "omp" : "omp";
    const child = spawn(ompBin, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PI_NO_PTY: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`OMP timed out after ${options.timeoutMs ?? 180000}ms`));
    }, options.timeoutMs ?? 180000);

    child.stdout.on("data", (d) => {
      stdout += d.toString("utf-8");
    });

    child.stderr.on("data", (d) => {
      stderr += d.toString("utf-8");
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn omp: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      const cleaned = cleanOmpOutput(stdout);

      if (code !== 0 && !cleaned) {
        reject(
          new Error(
            `omp exited with code ${code}. Stderr: ${cleanOmpOutput(stderr)}`
          )
        );
        return;
      }

      resolve(cleaned);
    });

    return await promise;
  } finally {
    // Clean up temporary files safely
    try {
      if (fs.existsSync(promptFile)) fs.unlinkSync(promptFile);
      if (sysFile && fs.existsSync(sysFile)) fs.unlinkSync(sysFile);
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Ask OMP specifically for code suggestions or file modifications.
 */
export async function askCodeSuggestion(
  req: OmpCodeSuggestionRequest
): Promise<string> {
  const system = `You are a Next.js / TypeScript code generator assisting agent ${req.agentName} (${req.agentRole}) in AgentCosmos.
Output ONLY the clean, working code for the target file. No markdown conversational prose. If using code fences, format as \`\`\`tsx or \`\`\`css.`;

  const prompt = `# Target File: ${req.filePath}
# Agent Intent: ${req.intent}
${
  req.currentContent
    ? `\n# Current File Content:\n${req.currentContent}\n`
    : "\n# Note: This is a new file to be created.\n"
}
Provide the complete updated code for ${req.filePath} that achieves the agent's intent cleanly, with no syntax errors, no broken imports, and strict TypeScript compatibility.`;

  const response = await runOmp({
    system,
    prompt,
    thinking: "minimal",
  });

  // Extract code from fences if provided
  const fenceMatch = response.match(/```(?:tsx|ts|css|javascript|json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }

  return response.trim();
}
