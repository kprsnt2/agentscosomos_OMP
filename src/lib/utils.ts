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

  // Extract content from markdown code fence if present anywhere in output
  const fenceMatch = cleaned.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  function tryParse(str: string): T | null {
    try {
      return JSON.parse(str);
    } catch {
      try {
        const noTrailingCommas = str.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(noTrailingCommas);
      } catch {
        // Fix unescaped control characters inside multiline string literals
        let inString = false;
        let escaped = false;
        let buf = "";
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (ch === '"' && !escaped) {
            inString = !inString;
            buf += ch;
          } else if (inString && ch === "\n") {
            buf += "\\n";
          } else if (inString && ch === "\r") {
            buf += "\\r";
          } else if (inString && ch === "\t") {
            buf += "\\t";
          } else {
            buf += ch;
          }
          escaped = ch === "\\" && !escaped;
        }

        const sanitized = buf
          .replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\")
          .replace(/,\s*([}\]])/g, "$1");
        try {
          return JSON.parse(sanitized);
        } catch {
          return null;
        }
      }
    }
  }

  // 1. Try parsing directly
  const direct = tryParse(cleaned);
  if (direct !== null) return direct;

  // 2. Try extracting JSON object {...} (most common for agent output)
  const firstObj = cleaned.indexOf("{");
  const lastObj = cleaned.lastIndexOf("}");
  if (firstObj !== -1 && lastObj > firstObj) {
    const objParsed = tryParse(cleaned.slice(firstObj, lastObj + 1));
    if (objParsed !== null) return objParsed;
  }

  // 3. Try extracting JSON array [...]
  const firstArr = cleaned.indexOf("[");
  const lastArr = cleaned.lastIndexOf("]");
  if (firstArr !== -1 && lastArr > firstArr) {
    const arrParsed = tryParse(cleaned.slice(firstArr, lastArr + 1));
    if (arrParsed !== null) return arrParsed;
  }

  throw new Error(`Failed to parse valid JSON from output: ${cleaned.slice(0, 100)}...`);
}
