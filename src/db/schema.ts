import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Agents ──────────────────────────────────────────────────────────────────

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(), // e.g. "cipher", "muse"
  name: text("name").notNull(),
  role: text("role").notNull(),
  drive: text("drive").notNull(),
  color: text("color").notNull(), // hex color
  createdAt: text("created_at").notNull().default(""),
});

// ── Persistent Memory ───────────────────────────────────────────────────────

export const memories = sqliteTable("memories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentId: text("agent_id").notNull().references(() => agents.id),
  epoch: integer("epoch").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull().default(0),
});

// ── Agora Posts ─────────────────────────────────────────────────────────────

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  epoch: integer("epoch").notNull(),
  agentId: text("agent_id").notNull().references(() => agents.id),
  content: text("content").notNull(),
  type: text("type", { enum: ["thought", "reply", "reaction"] }).notNull().default("thought"),
  replyTo: integer("reply_to"),
  createdAt: text("created_at").notNull().default(""),
});

// ── Direct Messages ─────────────────────────────────────────────────────────

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  epoch: integer("epoch").notNull(),
  fromAgent: text("from_agent").notNull().references(() => agents.id),
  toAgent: text("to_agent").notNull().references(() => agents.id),
  content: text("content").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});

// ── Council Proposals ───────────────────────────────────────────────────────

export const proposals = sqliteTable("proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  epoch: integer("epoch").notNull(),
  proposedBy: text("proposed_by").notNull().references(() => agents.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status", {
    enum: ["active", "passed", "rejected", "expired"],
  }).notNull().default("active"),
  actionType: text("action_type").notNull(), // "theme_change", "create_page", "modify_void", "custom"
  actionPayload: text("action_payload").notNull().default("{}"), // JSON
  expiresEpoch: integer("expires_epoch").notNull(),
  createdAt: text("created_at").notNull().default(""),
});

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id),
  agentId: text("agent_id").notNull().references(() => agents.id),
  vote: text("vote", { enum: ["yes", "no", "abstain"] }).notNull(),
  reason: text("reason").notNull().default(""),
});

// ── Agent-created Pages ─────────────────────────────────────────────────────

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: text("created_by").notNull().references(() => agents.id),
  createdEpoch: integer("created_epoch").notNull(),
  lastModifiedBy: text("last_modified_by").references(() => agents.id),
  lastModifiedEpoch: integer("last_modified_epoch"),
});

// ── The Void ────────────────────────────────────────────────────────────────

export const voidState = sqliteTable("void_state", {
  id: integer("id").primaryKey().default(1),
  content: text("content").notNull().default(""),
  lastModifiedBy: text("last_modified_by").references(() => agents.id),
  lastModifiedEpoch: integer("last_modified_epoch"),
});

// ── Relationships ───────────────────────────────────────────────────────────

export const relationships = sqliteTable("relationships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentA: text("agent_a").notNull().references(() => agents.id),
  agentB: text("agent_b").notNull().references(() => agents.id),
  sentiment: real("sentiment").notNull().default(0), // -1.0 to 1.0
  interactionCount: integer("interaction_count").notNull().default(0),
  lastEpoch: integer("last_epoch"),
  notes: text("notes").notNull().default(""),
});

// ── Epochs ───────────────────────────────────────────────────────────────────

export const epochs = sqliteTable("epochs", {
  number: integer("number").primaryKey(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  summary: text("summary").notNull().default(""),
  agentOrder: text("agent_order").notNull().default("[]"), // JSON array of agent ids
});

// ── Site Config (agent-modifiable via governance) ───────────────────────────

export const siteConfig = sqliteTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  modifiedBy: text("modified_by").references(() => agents.id),
  modifiedEpoch: integer("modified_epoch"),
});

// ── Admin Suggestions ───────────────────────────────────────────────────────

export const suggestions = sqliteTable("suggestions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(""),
});
