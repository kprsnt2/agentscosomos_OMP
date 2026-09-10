import { db } from "@/db";
import * as s from "@/db/schema";
import { AGENTS } from "@/agents/definitions";
import Link from "next/link";

export const revalidate = 30;

export default async function SkillsPage() {
  let allSkills: Array<typeof s.skills.$inferSelect> = [];
  let allAgents: Array<typeof s.agents.$inferSelect> = [];

  try {
    allSkills = await db.select().from(s.skills);
    allAgents = await db.select().from(s.agents);
  } catch (err) {
    console.warn("[SkillsPage] Database fetch warning:", err);
  }

  // Group skills by agent
  const skillsByAgent: Record<string, typeof allSkills> = {};
  for (const sk of allSkills) {
    if (!skillsByAgent[sk.agentId]) {
      skillsByAgent[sk.agentId] = [];
    }
    skillsByAgent[sk.agentId].push(sk);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-[--color-text]">
          Ecosystem Skills Matrix
        </h1>
        <p className="text-sm text-[--color-text-dim] mt-1">
          Evolving cognitive, creative, and substrate engineering capabilities acquired across epochs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAgents.map((agent) => {
          const agentSkills = skillsByAgent[agent.id] ?? [];
          const agentDef = AGENTS[agent.id];

          return (
            <div
              key={agent.id}
              className="border border-[--color-border] rounded-xl p-5 bg-white/[0.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[--color-border] mb-3">
                  <Link
                    href={`/quarters/${agent.id}`}
                    className="font-mono font-bold text-base hover:underline"
                    style={{ color: agent.color }}
                  >
                    {agent.name}
                  </Link>
                  <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-[--color-text-dim]">
                    {agentSkills.length} Skills
                  </span>
                </div>
                <p className="text-xs text-[--color-text-dim] mb-4">
                  {agent.role}
                </p>

                {agentSkills.length > 0 ? (
                  <div className="space-y-3">
                    {agentSkills.map((sk) => (
                      <div
                        key={sk.id}
                        className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-semibold text-[--color-text]">
                            {sk.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                            Lvl {sk.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-[--color-text-dim] leading-relaxed">
                          {sk.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-white/[0.01] border border-dashed border-white/10 text-center">
                    <p className="text-xs font-mono text-[--color-text-dim]">
                      No custom skills registered yet.
                    </p>
                    <p className="text-[10px] text-[--color-text-dim]/60 mt-1">
                      Learned dynamically via `learn_skill` action.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[--color-border]/50 flex items-center justify-between text-[11px] font-mono text-[--color-text-dim]">
                <span>Status: Active Inhabitant</span>
                <span style={{ color: agent.color }}>● Synced</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
