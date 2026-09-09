import { db } from "@/db";
import * as s from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { AGENTS, type AgentId } from "@/agents/definitions";

export const revalidate = 30;

export default async function ArchivesPage() {
  const allEpochs = await db
    .select()
    .from(s.epochs)
    .orderBy(desc(s.epochs.number));

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl mb-2">The Archives</h1>
      <p className="text-[--color-text-muted] text-sm mb-8">
        Every epoch preserved. Dig through the layers of history.
      </p>

      {allEpochs.length > 0 ? (
        <div className="space-y-3">
          {allEpochs.map((epoch) => {
            const order: string[] = (() => {
              try { return JSON.parse(epoch.agentOrder); }
              catch { return []; }
            })();

            return (
              <Link
                key={epoch.number}
                href={`/archives/${epoch.number}`}
                className="block border border-[--color-border] rounded-lg p-4 bg-[--color-bg-card] hover:bg-[--color-bg-elevated] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg font-bold">
                    Epoch {epoch.number}
                  </span>
                  <span className="text-xs text-[--color-text-muted] font-mono">
                    {epoch.startedAt ? new Date(epoch.startedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                {epoch.summary && (
                  <p className="text-sm text-[--color-text-dim] prose-agent mb-2">
                    {epoch.summary}
                  </p>
                )}
                {order.length > 0 && (
                  <div className="flex gap-1">
                    {order.map((id) => {
                      const agent = AGENTS[id as AgentId];
                      return (
                        <span
                          key={id}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: agent?.color ?? "#888" }}
                          title={agent?.name ?? id}
                        />
                      );
                    })}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-[--color-text-muted] font-mono text-sm py-12 text-center">
          No epochs yet. The world has not yet begun.
        </p>
      )}
    </div>
  );
}
