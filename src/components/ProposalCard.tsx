import { AGENTS, type AgentId } from "@/agents/definitions";

interface Vote {
  agentId: string;
  vote: string;
  reason: string;
}

interface ProposalCardProps {
  id: number;
  title: string;
  description: string;
  proposedBy: string;
  status: string;
  actionType: string;
  epoch: number;
  votes: Vote[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--color-active)",
  passed: "var(--color-passed)",
  rejected: "var(--color-rejected)",
  expired: "var(--color-expired)",
};

export function ProposalCard({
  id,
  title,
  description,
  proposedBy,
  status,
  actionType,
  epoch,
  votes,
}: ProposalCardProps) {
  const proposer = AGENTS[proposedBy as AgentId];
  const statusColor = STATUS_COLORS[status] ?? "var(--color-expired)";

  const yesVotes = votes.filter((v) => v.vote === "yes");
  const noVotes = votes.filter((v) => v.vote === "no");
  const abstainVotes = votes.filter((v) => v.vote === "abstain");

  return (
    <div className="border border-[--color-border] rounded-lg p-5 bg-[--color-bg-card]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[--color-text]">
            #{id}: {title}
          </h3>
          <p className="text-xs text-[--color-text-muted] mt-0.5">
            by{" "}
            <span style={{ color: proposer?.color }}>{proposer?.name ?? proposedBy}</span>
            {" · "}Epoch {epoch} · {actionType}
          </p>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full border"
          style={{ color: statusColor, borderColor: statusColor }}
        >
          {status}
        </span>
      </div>

      <p className="text-sm text-[--color-text-dim] mb-4 prose-agent">{description}</p>

      {/* Vote tally */}
      <div className="flex flex-wrap gap-4 text-xs">
        {yesVotes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[--color-passed]">✓ {yesVotes.length}</span>
            <div className="flex -space-x-1">
              {yesVotes.map((v) => (
                <span
                  key={v.agentId}
                  className="w-4 h-4 rounded-full border border-[--color-bg-card]"
                  style={{ backgroundColor: AGENTS[v.agentId as AgentId]?.color ?? "#888" }}
                  title={`${v.agentId}: ${v.reason}`}
                />
              ))}
            </div>
          </div>
        )}
        {noVotes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[--color-rejected]">✗ {noVotes.length}</span>
            <div className="flex -space-x-1">
              {noVotes.map((v) => (
                <span
                  key={v.agentId}
                  className="w-4 h-4 rounded-full border border-[--color-bg-card]"
                  style={{ backgroundColor: AGENTS[v.agentId as AgentId]?.color ?? "#888" }}
                  title={`${v.agentId}: ${v.reason}`}
                />
              ))}
            </div>
          </div>
        )}
        {abstainVotes.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[--color-text-muted]">— {abstainVotes.length}</span>
          </div>
        )}
        {votes.length === 0 && (
          <span className="text-[--color-text-muted]">No votes yet</span>
        )}
      </div>
    </div>
  );
}
