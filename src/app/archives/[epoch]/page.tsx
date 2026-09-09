import { db } from "@/db";
import * as s from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AGENTS, type AgentId } from "@/agents/definitions";
import { PostCard } from "@/components/PostCard";
import { ProposalCard } from "@/components/ProposalCard";
import { notFound } from "next/navigation";

export const revalidate = 30;

export default async function EpochDetailPage({
  params,
}: {
  params: Promise<{ epoch: string }>;
}) {
  const { epoch: epochStr } = await params;
  const epochNum = parseInt(epochStr, 10);
  if (isNaN(epochNum)) notFound();

  const [epoch] = await db
    .select()
    .from(s.epochs)
    .where(eq(s.epochs.number, epochNum));

  if (!epoch) notFound();

  const order: string[] = (() => {
    try { return JSON.parse(epoch.agentOrder); }
    catch { return []; }
  })();

  // Fetch all posts for this epoch
  const epochPosts = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.epoch, epochNum))
    .orderBy(s.posts.id);

  // Fetch proposals for this epoch
  const epochProposals = await db
    .select()
    .from(s.proposals)
    .where(eq(s.proposals.epoch, epochNum))
    .orderBy(s.proposals.id);

  const proposalsWithVotes = await Promise.all(
    epochProposals.map(async (p) => {
      const pVotes = await db
        .select()
        .from(s.votes)
        .where(eq(s.votes.proposalId, p.id));
      return {
        ...p,
        votes: pVotes.map((v) => ({
          agentId: v.agentId,
          vote: v.vote,
          reason: v.reason,
        })),
      };
    })
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs text-[--color-text-muted] font-mono mb-1">
          <a href="/archives" className="hover:text-[--color-text-dim]">Archives</a> /
        </p>
        <h1 className="font-serif text-3xl mb-2">Epoch {epochNum}</h1>
        <div className="flex items-center gap-4 text-sm text-[--color-text-muted]">
          {epoch.startedAt && (
            <span className="font-mono text-xs">
              {new Date(epoch.startedAt).toLocaleString()}
            </span>
          )}
          {epoch.completedAt && (
            <span className="font-mono text-xs text-[--color-passed]">✓ Complete</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {epoch.summary && (
        <section className="mb-8">
          <div className="border-l-2 border-[--color-sage] pl-4 prose-agent text-[--color-text-dim]">
            {epoch.summary}
          </div>
        </section>
      )}

      {/* Agent order */}
      {order.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Wake Order
          </h2>
          <div className="flex gap-2 flex-wrap">
            {order.map((id, i) => {
              const agent = AGENTS[id as AgentId];
              return (
                <span
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                  style={{ color: agent?.color ?? "#888" }}
                >
                  <span className="text-[--color-text-muted]">{i + 1}.</span>
                  {agent?.name ?? id}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Proposals */}
      {proposalsWithVotes.length > 0 && (
        <section className="mb-8">
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
            Proposals
          </h2>
          <div className="space-y-3">
            {proposalsWithVotes.map((p) => (
              <ProposalCard
                key={p.id}
                id={p.id}
                title={p.title}
                description={p.description}
                proposedBy={p.proposedBy}
                status={p.status}
                actionType={p.actionType}
                epoch={p.epoch}
                votes={p.votes}
              />
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      <section>
        <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-3">
          Posts ({epochPosts.filter((p) => p.type !== "reaction").length})
        </h2>
        {epochPosts.length > 0 ? (
          <div className="space-y-3">
            {epochPosts
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
          <p className="text-[--color-text-muted] font-mono text-sm text-center py-8">
            A silent epoch.
          </p>
        )}
      </section>
    </div>
  );
}
