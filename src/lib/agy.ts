import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export interface AgyRunOptions {
  prompt: string;
  system?: string;
  model?: string;
  effort?: "low" | "medium" | "high";
  timeoutMs?: number;
}

/**
 * Locate agy executable path across platforms.
 */
export function getAgyBin(): string {
  if (process.env.AGY_BIN && fs.existsSync(process.env.AGY_BIN)) {
    return process.env.AGY_BIN;
  }
  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
    const defaultWin = path.join(localAppData, "agy", "bin", "agy.exe");
    if (fs.existsSync(defaultWin)) {
      return defaultWin;
    }
  }
  return "agy";
}

/**
 * Clean ANSI escape sequences and UI banners from output.
 */
export function cleanAgyOutput(raw: string): string {
  // eslint-disable-next-line no-control-regex
  let text = raw.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
  text = text.replace(/^Thinking\.\.\.\s*/i, "");
  return text.trim();
}

/**
 * Execute Antigravity (agy) CLI with unlimited access to the project directory.
 * `--dangerously-skip-permissions` enables non-interactive file and system tool access.
 */
export async function runAgy(options: AgyRunOptions): Promise<string> {
  const fullPrompt = options.system
    ? `[System Instructions]\n${options.system}\n\n[Task]\n${options.prompt}`
    : options.prompt;

  const agyBin = getAgyBin();
  const args: string[] = ["--dangerously-skip-permissions", "-p", fullPrompt];

  if (options.model) {
    args.unshift(`--model=${options.model}`);
  }

  if (options.effort) {
    args.unshift(`--effort=${options.effort}`);
  }

  const { promise, resolve, reject } = Promise.withResolvers<string>();

  const child = spawn(agyBin, args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
    },
  });

  let stdout = "";
  let stderr = "";

  const timeout = setTimeout(() => {
    child.kill();
    reject(new Error(`Antigravity CLI (agy) timed out after ${options.timeoutMs ?? 180000}ms`));
  }, options.timeoutMs ?? 180000);

  child.stdout.on("data", (d) => {
    stdout += d.toString("utf-8");
  });

  child.stderr.on("data", (d) => {
    stderr += d.toString("utf-8");
  });

  child.on("error", (err) => {
    clearTimeout(timeout);
    reject(new Error(`Failed to spawn agy (${agyBin}): ${err.message}`));
  });

  child.on("close", (code) => {
    clearTimeout(timeout);
    const cleaned = cleanAgyOutput(stdout);

    if (code !== 0 && !cleaned) {
      reject(
        new Error(`agy exited with code ${code}. Stderr: ${cleanAgyOutput(stderr)}`)
      );
      return;
    }

    resolve(cleaned);
  });

  return await promise;
}
