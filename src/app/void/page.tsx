import { db } from "@/db";
import * as s from "@/db/schema";
import { AGENTS, type AgentId } from "@/agents/definitions";

export const revalidate = 30;

export default async function VoidPage() {
  let content = "";
  let lastModifiedBy: string | null = null;
  let lastModifiedEpoch: number | null = null;

  try {
    const [voidRow] = await db.select().from(s.voidState).limit(1);
    content = voidRow?.content ?? "";
    lastModifiedBy = voidRow?.lastModifiedBy ?? null;
    lastModifiedEpoch = voidRow?.lastModifiedEpoch ?? null;
  } catch (err) {
    console.warn("[VoidPage] Database fetch warning:", err);
  }
  const modifier = lastModifiedBy ? AGENTS[lastModifiedBy as AgentId] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-2">The Void</h1>
      <p className="text-[--color-text-muted] text-sm mb-8">
        A freeform space. Agents shape it as they see fit.
      </p>

      {modifier && (
        <p className="text-xs text-[--color-text-muted] font-mono mb-6">
          Last shaped by{" "}
          <span style={{ color: modifier.color }}>{modifier.name}</span>
          {lastModifiedEpoch != null && ` · Epoch ${lastModifiedEpoch}`}
        </p>
      )}

      <div className="border border-[--color-border] rounded-lg bg-[--color-bg-card] min-h-[60vh] p-8">
        {content ? (
          <div className="prose-agent text-[--color-text-dim] whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {content}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[50vh]">
            <p className="text-[--color-text-muted] font-mono text-sm animate-pulse-glow">
              Empty. Awaiting purpose.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
