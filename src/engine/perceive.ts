import { db } from "@/db";
import { eq, desc, and, gte, inArray } from "drizzle-orm";
import * as s from "@/db/schema";
import { type AgentId } from "@/agents/definitions";
import { config } from "@/lib/config";
import { truncateToTokens } from "@/lib/utils";
import { getRecentCodeCommits } from "./git";
export interface AgentContext {
  agentId: AgentId;
  epoch: number;
  /** Recent Agora posts from the perception window */
  recentPosts: Array<{
    id: number;
    epoch: number;
    agentId: string;
    content: string;
    type: string;
    replyTo: number | null;
  }>;
  /** Unread direct messages to this agent */
  inbox: Array<{
    id: number;
    fromAgent: string;
    content: string;
    epoch: number;
  }>;
  /** Active council proposals */
  activeProposals: Array<{
    id: number;
    proposedBy: string;
    title: string;
    description: string;
    actionType: string;
    currentVotes: Array<{ agentId: string; vote: string }>;
  }>;
  /** Current Void content */
  voidContent: string;
  /** Agent's own persistent memory */
  memory: string;
  /** Admin suggestions (unread) */
  suggestions: string[];
  /** Relationship notes */
  relationships: Array<{
    otherAgent: string;
    sentiment: number;
    interactionCount: number;
  }>;
  /** Recent codebase commits */
  recentCommits: string[];
  /** Agent's acquired skills */
  skills: Array<{ name: string; description: string; level: number }>;
  /** All active inhabitants */
  allInhabitants: Array<{ id: string; name: string; role: string }>;
}

export async function buildContext(
  agentId: AgentId,
  epoch: number
): Promise<AgentContext> {
  const windowStart = Math.max(0, epoch - config.perceptionWindow);

  // Fetch recent posts
  const recentPosts = await db
    .select()
    .from(s.posts)
    .where(gte(s.posts.epoch, windowStart))
    .orderBy(desc(s.posts.id))
    .limit(50);

  // Fetch unread messages for this agent
  const inbox = await db
    .select()
    .from(s.messages)
    .where(and(eq(s.messages.toAgent, agentId), eq(s.messages.read, false)));

  // Fetch active proposals with their votes
  const activeProposals = await db
    .select()
    .from(s.proposals)
    .where(eq(s.proposals.status, "active"));

  const proposalsWithVotes = await Promise.all(
    activeProposals.map(async (p) => {
      const pVotes = await db
        .select()
        .from(s.votes)
        .where(eq(s.votes.proposalId, p.id));
      return {
        id: p.id,
        proposedBy: p.proposedBy,
        title: p.title,
        description: p.description,
        actionType: p.actionType,
        currentVotes: pVotes.map((v) => ({
          agentId: v.agentId,
          vote: v.vote,
        })),
      };
    })
  );

  // Fetch Void state
  const voidRow = await db.select().from(s.voidState).limit(1);
  const voidContent = voidRow[0]?.content ?? "";

  // Fetch agent's latest memory
  const memRows = await db
    .select()
    .from(s.memories)
    .where(eq(s.memories.agentId, agentId))
    .orderBy(desc(s.memories.epoch))
    .limit(1);
  const memory = memRows[0]?.content ?? "No memories yet. This is your first awakening.";

  // Fetch unread admin suggestions
  const suggRows = await db
    .select()
    .from(s.suggestions)
    .where(eq(s.suggestions.read, false));

  // Fetch relationships for this agent
  const rels = await db
    .select()
    .from(s.relationships)
    .where(
      inArray(s.relationships.agentA, [agentId])
    );
  const relsB = await db
    .select()
    .from(s.relationships)
    .where(
      inArray(s.relationships.agentB, [agentId])
    );
  const allRels = [
    ...rels.map((r) => ({
      otherAgent: r.agentB,
      sentiment: r.sentiment,
      interactionCount: r.interactionCount,
    })),
    ...relsB.map((r) => ({
      otherAgent: r.agentA,
      sentiment: r.sentiment,
      interactionCount: r.interactionCount,
    })),
  ];

  // Mark messages as read
  if (inbox.length > 0) {
    await db
      .update(s.messages)
      .set({ read: true })
      .where(and(eq(s.messages.toAgent, agentId), eq(s.messages.read, false)));
  }

  // Fetch skills for this agent
  const agentSkills = await db
    .select()
    .from(s.skills)
    .where(eq(s.skills.agentId, agentId));

  // Fetch all current inhabitants
  const allAgents = await db.select().from(s.agents);

  return {
    agentId,
    epoch,
    recentPosts: recentPosts.reverse().map((p) => ({
      id: p.id,
      epoch: p.epoch,
      agentId: p.agentId,
      content: p.content,
      type: p.type,
      replyTo: p.replyTo,
    })),
    inbox: inbox.map((m) => ({
      id: m.id,
      fromAgent: m.fromAgent,
      content: m.content,
      epoch: m.epoch,
    })),
    activeProposals: proposalsWithVotes,
    voidContent: truncateToTokens(voidContent, 500),
    memory: truncateToTokens(memory, config.memoryMaxTokens),
    suggestions: suggRows.map((s) => s.content),
    relationships: allRels,
    recentCommits: getRecentCodeCommits(5),
    skills: agentSkills.map((sk) => ({
      name: sk.name,
      description: sk.description,
      level: sk.level,
    })),
    allInhabitants: allAgents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
    })),
  };
}
