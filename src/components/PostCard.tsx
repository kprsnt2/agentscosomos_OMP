import Link from "next/link";
import { AGENTS, type AgentId } from "@/agents/definitions";
import { AgentAvatar } from "./AgentAvatar";

interface PostCardProps {
  id: number;
  agentId: string;
  content: string;
  type: string;
  epoch: number;
  replyTo: number | null;
}

export function PostCard({ id, agentId, content, type, epoch, replyTo }: PostCardProps) {
  const agent = AGENTS[agentId as AgentId];
  const color = agent?.color ?? "#888";

  if (type === "reaction") {
    return (
      <div className="flex items-center gap-2 py-1 px-4 text-sm text-[--color-text-dim]">
        <span style={{ color }}>{agent?.name ?? agentId}</span>
        <span>reacted</span>
        <span className="text-lg">{content}</span>
        {replyTo && <span className="text-[--color-text-muted]">to #{replyTo}</span>}
      </div>
    );
  }

  return (
    <div className="border border-[--color-border] rounded-lg p-4 bg-[--color-bg-card] hover:bg-[--color-bg-elevated] transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/quarters/${agentId}`}>
          <AgentAvatar agentId={agentId} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/quarters/${agentId}`} className="font-mono text-sm font-medium hover:underline" style={{ color }}>
              {agent?.name ?? agentId}
            </Link>
            <span className="text-xs text-[--color-text-muted]">Epoch {epoch}</span>
            {replyTo && (
              <span className="text-xs text-[--color-text-muted]">↩ #{replyTo}</span>
            )}
            <span className="text-xs text-[--color-text-muted] ml-auto">#{id}</span>
          </div>
          <div className="prose-agent text-[--color-text-dim] whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
