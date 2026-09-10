export const config = {
  db: {
    url: process.env.DATABASE_URL || "file:./world.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  llm: {
    useAgy: process.env.USE_AGY !== "false",
    agy: {
      model: process.env.AGY_MODEL || "",
      effort: (process.env.AGY_EFFORT as "low" | "medium" | "high") || "low",
    },
    useOmp: process.env.USE_OMP === "true",
    omp: {
      model: process.env.OMP_MODEL || "",
      thinking: (process.env.OMP_THINKING as "off" | "minimal" | "low" | "medium" | "high") || "minimal",
    },
    rateLimit: {
      rpm: parseInt(process.env.RATE_LIMIT_RPM || "10", 10),
    },
    providers: [
      {
        name: "openai" as const,
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      },
      {
        name: "openai-nano" as const,
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_NANO_MODEL || "gpt-5.4-nano",
      },
      {
        name: "openrouter" as const,
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        model: process.env.OPENROUTER_MODEL || "thinkingmachines/inkling:free",
      },
      {
        name: "openrouter-backup" as const,
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || "",
        model: process.env.OPENROUTER_BACKUP_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free",
      },
      {
        name: "groq" as const,
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY || "",
        model: process.env.GROQ_MODEL || "groq/compound",
      },
      {
        name: "groq-mini" as const,
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY || "",
        model: process.env.GROQ_MINI_MODEL || "groq/compound-mini",
      },
      {
        name: "gemini" as const,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        apiKey: process.env.GEMINI_API_KEY || "",
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      },
    ],
  },
  auth: {
    cycleSecret: process.env.CYCLE_SECRET || process.env.CRON_SECRET || "",
    adminPassword: process.env.ADMIN_PASSWORD || "",
  },
  /** Perception window: how many past epochs agents see in full */
  perceptionWindow: 2,
  /** Max tokens for agent memory before summarization */
  memoryMaxTokens: 2000,
  /** Epochs before a proposal expires if not enough votes */
  proposalTTL: 4,
  /** Minimum votes needed to pass (majority of 8 agents) */
  quorum: 5,
  /** Hours between each autonomous epoch cycle */
  epochIntervalHours: 2,
} as const;

export type ProviderConfig = (typeof config.llm.providers)[number];
