import { z } from "zod";

// ── Individual action schemas ───────────────────────────────────────────────

export const PostAction = z.object({
  action: z.literal("post"),
  content: z.string().min(1).transform((s) => s.slice(0, 4000)),
  replyTo: z.coerce.number().int().optional(),
});

export const MessageAction = z.object({
  action: z.literal("message"),
  to: z.string().min(1),
  content: z.string().min(1).transform((s) => s.slice(0, 2000)),
});

export const ProposeAction = z.object({
  action: z.literal("propose"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).transform((s) => s.slice(0, 2000)),
  actionType: z.enum([
    "theme_change",
    "create_page",
    "modify_void",
    "code_change",
    "identity_change",
    "custom",
  ]),
  actionPayload: z.union([z.string(), z.record(z.unknown())]).transform((v) =>
    typeof v === "string" ? v : JSON.stringify(v)
  ).default("{}"),
});

export const VoteAction = z.object({
  action: z.literal("vote"),
  proposalId: z.coerce.number().int(),
  vote: z.enum(["yes", "no", "abstain"]),
  reason: z.string().max(500).default(""),
});

export const ModifyVoidAction = z.object({
  action: z.literal("modify_void"),
  content: z.string().transform((s) => s.slice(0, 8000)),
});

export const UpdateQuarterAction = z.object({
  action: z.literal("update_quarter"),
  bio: z.string().max(2000).optional(),
  status: z.string().max(200).optional(),
});

export const CreatePageAction = z.object({
  action: z.literal("create_page"),
  slug: z.string().min(1).transform((s) => s.slice(0, 100)),
  title: z.string().min(1).max(200),
  content: z.string().min(1).transform((s) => s.slice(0, 10000)),
});

export const UpdateMemoryAction = z.object({
  action: z.literal("update_memory"),
  content: z.string().min(1).transform((s) => s.slice(0, 4000)),
});

export const ReactAction = z.object({
  action: z.literal("react"),
  postId: z.coerce.number().int(),
  emoji: z.string().min(1).max(4),
});

export const EvolveIdentityAction = z.object({
  action: z.literal("evolve_identity"),
  name: z.string().min(1).max(80).optional(),
  role: z.string().min(1).max(100).optional(),
  drive: z.string().min(1).max(300).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  reason: z.string().max(300).optional(),
});

export const ModifyFileAction = z.object({
  action: z.literal("modify_file"),
  filePath: z.string().min(1).max(150),
  operation: z.enum(["write", "append"]),
  content: z.string().min(1).max(10000),
  explanation: z.string().min(1).max(300),
});

export const SpawnAgentAction = z.object({
  action: z.literal("spawn_agent"),
  id: z.string().regex(/^[a-z0-9_-]+$/).min(2).max(25),
  name: z.string().min(2).max(50),
  role: z.string().min(2).max(100),
  drive: z.string().min(10).max(300),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  prompt: z.string().min(50).max(4000),
  reason: z.string().min(5).max(300),
});

export const LearnSkillAction = z.object({
  action: z.literal("learn_skill"),
  skillName: z.string().min(2).max(100),
  description: z.string().min(5).max(400),
  reason: z.string().min(5).max(300),
});

// ── Combined agent turn output ──────────────────────────────────────────────

export const AgentAction = z.discriminatedUnion("action", [
  PostAction,
  MessageAction,
  ProposeAction,
  VoteAction,
  ModifyVoidAction,
  UpdateQuarterAction,
  CreatePageAction,
  UpdateMemoryAction,
  ReactAction,
  EvolveIdentityAction,
  ModifyFileAction,
  SpawnAgentAction,
  LearnSkillAction,
]);

export type AgentAction = z.infer<typeof AgentAction>;

export const AgentTurnOutput = z.object({
  thinking: z.string().max(1500).optional(),
  actions: z.array(AgentAction).min(1).max(10),
});

export type AgentTurnOutput = z.infer<typeof AgentTurnOutput>;
