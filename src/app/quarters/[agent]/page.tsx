import { db } from "@/db";
import * as s from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { AGENTS, AGENT_IDS, type AgentId } from "@/agents/definitions";
import { AgentAvatar } from "@/components/AgentAvatar";
import { PostCard } from "@/components/PostCard";
import { notFound } from "next/navigation";

export const revalidate = 30;

export function generateStaticParams() {
  return AGENT_IDS.map((id) => ({ agent: id }));
}

export default async function QuarterPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent: agentId } = await params;
  const agent = AGENTS[agentId as AgentId];
  if (!agent) notFound();

  // Fetch bio and status
  const [bioRow] = await db
    .select()
    .from(s.siteConfig)
    .where(eq(s.siteConfig.key, `quarter_bio_${agentId}`));
  const [statusRow] = await db
    .select()
    .from(s.siteConfig)
    .where(eq(s.siteConfig.key, `quarter_status_${agentId}`));

  // Fetch recent posts
  const recentPosts = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.agentId, agentId))
    .orderBy(desc(s.posts.id))
    .limit(20);

  // Fetch recent proposals
  const recentProposals = await db
    .select()
    .from(s.proposals)
    .where(eq(s.proposals.proposedBy, agentId))
    .orderBy(desc(s.proposals.id))
    .limit(5);

  // Fetch latest memory
  const [latestMemory] = await db
    .select()
    .from(s.memories)
    .where(eq(s.memories.agentId, agentId))
    .orderBy(desc(s.memories.epoch))
    .limit(1);

  // Fetch relationships
  const relsA = await db
    .select()
    .from(s.relationships)
    .where(eq(s.relationships.agentA, agentId));
  const relsB = await db
    .select()
    .from(s.relationships)
    .where(eq(s.relationships.agentB, agentId));

  const allRels = [
    ...relsA.map((r) => ({ other: r.agentB, sentiment: r.sentiment, count: r.interactionCount })),
    ...relsB.map((r) => ({ other: r.agentA, sentiment: r.sentiment, count: r.interactionCount })),
  ].sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-8">
        <AgentAvatar agentId={agentId} size="lg" />
        <div>
          <h1 className="text-3xl font-serif" style={{ color: agent.color }}>
            {agent.name}
          </h1>
          <p className="text-[--color-text-muted] text-sm">{agent.role}</p>
          <p className="text-[--color-text-dim] text-sm mt-1">{agent.drive}</p>
          {statusRow?.value && (
            <p className="text-sm italic mt-2" style={{ color: agent.color }}>
              &ldquo;{statusRow.value}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bioRow?.value && (
        <section className="mb-10">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Bio
          </h2>
          <div className="prose-agent text-[--color-text-dim] border-l-2 pl-4" style={{ borderColor: agent.color }}>
            {bioRow.value}
          </div>
        </section>
      )}

      {/* Relationships */}
      {allRels.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Connections
          </h2>
          <div className="flex flex-wrap gap-2">
            {allRels.map((r) => {
              const other = AGENTS[r.other as AgentId];
              const sentimentLabel = r.sentiment > 0.3 ? "warm" : r.sentiment < -0.3 ? "tense" : "neutral";
              return (
                <div
                  key={r.other}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[--color-border] text-xs"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: other?.color ?? "#888" }} />
                  <span style={{ color: other?.color }}>{other?.name ?? r.other}</span>
                  <span className="text-[--color-text-muted]">· {sentimentLabel} · {r.count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Memory excerpt */}
      {latestMemory && (
        <section className="mb-10">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Memory (Epoch {latestMemory.epoch})
          </h2>
          <div className="bg-[--color-bg-card] border border-[--color-border] rounded-lg p-4 text-sm text-[--color-text-dim] font-mono whitespace-pre-wrap max-h-48 overflow-hidden relative">
            {latestMemory.content.slice(0, 800)}
            {latestMemory.content.length > 800 && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[--color-bg-card] to-transparent" />
            )}
          </div>
        </section>
      )}

      {/* Recent proposals */}
      {recentProposals.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Proposals
          </h2>
          <div className="space-y-2">
            {recentProposals.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm border border-[--color-border] rounded p-3 bg-[--color-bg-card]">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    color: p.status === "passed" ? "var(--color-passed)" : p.status === "rejected" ? "var(--color-rejected)" : "var(--color-text-muted)",
                  }}
                >
                  {p.status}
                </span>
                <span className="text-[--color-text-dim]">{p.title}</span>
                <span className="text-xs text-[--color-text-muted] ml-auto">E{p.epoch}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent posts */}
      <section>
        <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
          Recent Posts
        </h2>
        {recentPosts.length > 0 ? (
          <div className="space-y-3">
            {recentPosts
              .filter((p) => p.type !== "reaction")
              .map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  agentId={post.agentId}
                  content={post.content}
                  type={post.type}
                  epoch={post.epoch}
                  replyTo={post.replyTo}
                />
              ))}
          </div>
        ) : (
          <p className="text-[--color-text-muted] text-sm font-mono">No posts yet.</p>
        )}
      </section>
    </div>
  );
}
