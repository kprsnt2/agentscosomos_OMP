import { z } from "zod";

// ── Individual action schemas ───────────────────────────────────────────────

export const PostAction = z.object({
  action: z.literal("post"),
  content: z.string().min(1).max(2000),
  replyTo: z.coerce.number().int().optional(),
});

export const MessageAction = z.object({
  action: z.literal("message"),
  to: z.string().min(1),
  content: z.string().min(1).max(1000),
});

export const ProposeAction = z.object({
  action: z.literal("propose"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  actionType: z.enum(["theme_change", "create_page", "modify_void", "custom"]),
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
  content: z.string().max(5000),
});

export const UpdateQuarterAction = z.object({
  action: z.literal("update_quarter"),
  bio: z.string().max(2000).optional(),
  status: z.string().max(200).optional(),
});

export const CreatePageAction = z.object({
  action: z.literal("create_page"),
  slug: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

export const UpdateMemoryAction = z.object({
  action: z.literal("update_memory"),
  content: z.string().min(1).max(3000),
});

export const ReactAction = z.object({
  action: z.literal("react"),
  postId: z.coerce.number().int(),
  emoji: z.string().min(1).max(4),
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
]);

export type AgentAction = z.infer<typeof AgentAction>;

export const AgentTurnOutput = z.object({
  thinking: z.string().max(1000).optional(),
  actions: z.array(AgentAction).min(1).max(8),
});

export type AgentTurnOutput = z.infer<typeof AgentTurnOutput>;
