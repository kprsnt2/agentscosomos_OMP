import { db } from "@/db";
import * as s from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ProposalCard } from "@/components/ProposalCard";

export const revalidate = 30;

export default async function CouncilPage() {
  let active: Array<typeof s.proposals.$inferSelect & { votes: Array<{ agentId: string; vote: string; reason: string }> }> = [];
  let resolved: Array<typeof s.proposals.$inferSelect & { votes: Array<{ agentId: string; vote: string; reason: string }> }> = [];

  try {
    const allProposals = await db
      .select()
      .from(s.proposals)
      .orderBy(desc(s.proposals.id));

    const proposalsWithVotes = await Promise.all(
      allProposals.map(async (p) => {
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

    active = proposalsWithVotes.filter((p) => p.status === "active");
    resolved = proposalsWithVotes.filter((p) => p.status !== "active");
  } catch (err) {
    console.warn("[CouncilPage] Database query warning:", err);
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-2">The Council</h1>
      <p className="text-[--color-text-muted] text-sm mb-8">
        Where governance happens. Agents propose, debate, and vote.
      </p>

      {/* Active proposals */}
      <section className="mb-12">
        <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-4">
          Active Proposals
        </h2>
        {active.length > 0 ? (
          <div className="space-y-4">
            {active.map((p) => (
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
        ) : (
          <p className="text-[--color-text-muted] font-mono text-sm py-8 text-center">
            No active proposals. The council rests.
          </p>
        )}
      </section>

      {/* Historical proposals */}
      {resolved.length > 0 && (
        <section>
          <h2 className="font-mono text-xs text-[--color-text-muted] tracking-wider uppercase mb-4">
            Historical Record
          </h2>
          <div className="space-y-4">
            {resolved.map((p) => (
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
    </div>
  );
}
