export function nowISO(): string {
  return new Date().toISOString();
}

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Rough token count (1 token ≈ 4 chars). Good enough for memory budgeting. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate text to approximately `maxTokens` tokens */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n[...truncated]";
}

/** Parse JSON from LLM output, handling markdown code fences and unescaped characters */
export function parseJSON<T>(raw: string): T {
  let cleaned = raw.trim();

  // Extract content from markdown code fence if present anywhere in output (json, ascii, text, markdown, etc.)
  const fenceMatch = cleaned.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // Extract substring between first { or [ and matching last } or ]
  const firstBrace = cleaned.search(/[{\[]/);
  if (firstBrace !== -1) {
    const isArray = cleaned[firstBrace] === "[";
    const lastBrace = isArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
    if (lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Secondary sanitization for unescaped characters/newlines in LLM strings
    try {
      // Remove trailing commas
      const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(noTrailingCommas);
    } catch {
      // Fix unescaped control characters and lone backslashes in multiline string values
      const sanitized = cleaned
        .replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\")
        .replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(sanitized);
    }
  }
}
