import OpenAI from "openai";
import { config, type ProviderConfig } from "./config";

// ── Rate limiter ────────────────────────────────────────────────────────────

const callTimestamps: Map<string, number[]> = new Map();

function waitForRateLimit(provider: string): Promise<void> {
  const { rpm } = config.llm.rateLimit;
  const minGapMs = (60 / rpm) * 1000;
  const now = Date.now();
  const timestamps = callTimestamps.get(provider) ?? [];

  // Prune timestamps older than 60s
  const recent = timestamps.filter((t) => now - t < 60_000);

  if (recent.length >= rpm) {
    const oldestInWindow = recent[0]!;
    const waitMs = 60_000 - (now - oldestInWindow) + 100; // +100ms buffer
    return new Promise((r) => setTimeout(r, waitMs));
  }

  if (recent.length > 0) {
    const lastCall = recent[recent.length - 1]!;
    const elapsed = now - lastCall;
    if (elapsed < minGapMs) {
      return new Promise((r) => setTimeout(r, minGapMs - elapsed + 50));
    }
  }

  return Promise.resolve();
}

function recordCall(provider: string): void {
  const timestamps = callTimestamps.get(provider) ?? [];
  timestamps.push(Date.now());
  // Keep only last 60s
  const cutoff = Date.now() - 60_000;
  callTimestamps.set(provider, timestamps.filter((t) => t > cutoff));
}

// ── Client cache ────────────────────────────────────────────────────────────

const clients = new Map<string, OpenAI>();

function getClient(p: ProviderConfig): OpenAI {
  let client = clients.get(p.name);
  if (!client) {
    client = new OpenAI({ baseURL: p.baseURL, apiKey: p.apiKey });
    clients.set(p.name, client);
  }
  return client;
}

// ── Main completion with fallback chain ─────────────────────────────────────

export interface CompletionParams {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  provider: string;
  model: string;
  tokensUsed: { prompt: number; completion: number };
}

export async function complete(params: CompletionParams): Promise<CompletionResult> {
  const available = config.llm.providers.filter((p) => p.apiKey);

  if (available.length === 0) {
    throw new Error(
      "No LLM provider configured. Set at least one API key in .env"
    );
  }

  const errors: Array<{ provider: string; error: string }> = [];

  for (const provider of available) {
    try {
      await waitForRateLimit(provider.name);
      const client = getClient(provider);

      const tokenLimit = params.maxTokens ?? 1000;

      // Newer OpenAI models (gpt-4o, gpt-5, o-series) require max_completion_tokens
      // Other providers (OpenRouter, Groq, Gemini) require max_tokens
      const body: Parameters<typeof client.chat.completions.create>[0] = {
        model: provider.model,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.prompt },
        ],
        temperature: params.temperature ?? 0.8,
        stream: false,
        ...(provider.name === "openai"
          ? { max_completion_tokens: tokenLimit }
          : { max_tokens: tokenLimit }),
      };

      const response = await client.chat.completions.create(body);

      recordCall(provider.name);

      if (!("choices" in response)) {
        throw new Error("Unexpected stream response from model");
      }

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new Error("Empty response from model");
      }

      return {
        content: choice.message.content,
        provider: provider.name,
        model: provider.model,
        tokensUsed: {
          prompt: response.usage?.prompt_tokens ?? 0,
          completion: response.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ provider: provider.name, error: msg });
      console.error(`[LLM] ${provider.name} failed: ${msg}`);
      // Continue to next provider
    }
  }

  throw new Error(
    `All LLM providers failed:\n${errors.map((e) => `  ${e.provider}: ${e.error}`).join("\n")}`
  );
}
