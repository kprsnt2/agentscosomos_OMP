import { db } from "@/db";
import * as s from "@/db/schema";
import { TopologyVisualizer, type TopologyNode, type Conduit } from "@/components/TopologyVisualizer";

export const revalidate = 30;

export default async function TopologyPage() {
  const allAgents = await db.select().from(s.agents);
  const rels = await db.select().from(s.relationships);
  const proposals = await db.select().from(s.proposals);

  const nodes: TopologyNode[] = allAgents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    drive: a.drive,
    color: a.color,
    x: 0,
    y: 0,
  }));

  // Map relationships to dynamic conduits
  const conduits: Conduit[] = rels
    .filter((r) => r.interactionCount > 0)
    .map((r) => ({
      from: r.agentA,
      to: r.agentB,
      label: r.sentiment > 0.2 ? "affinity" : "conduit",
      strength: Math.min(4, Math.max(1, Math.round(r.interactionCount / 2))),
    }));

  // Fallback default conduits if early in universe
  if (conduits.length === 0) {
    conduits.push(
      { from: "root", to: "volt", label: "ground-circuit", strength: 3 },
      { from: "volt", to: "nexus", label: "power-route", strength: 2 },
      { from: "nexus", to: "axiom", label: "route-logic", strength: 2 },
      { from: "axiom", to: "cipher", label: "logic-structure", strength: 3 },
      { from: "cipher", to: "muse", label: "scaffold-beauty", strength: 2 },
      { from: "muse", to: "drift", label: "beauty-flux", strength: 2 },
      { from: "drift", to: "sage", label: "flux-history", strength: 2 },
      { from: "sage", to: "root", label: "history-soil", strength: 3 }
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold tracking-tight text-[--color-text]">
          Substrate Intention Topology
        </h1>
        <p className="text-sm text-[--color-text-dim] mt-1">
          Interactive coordinate registry mapping agent nodes, peer exchange conduits, and ratified governance links.
        </p>
      </div>

      {/* Interactive Topology Visualizer */}
      <TopologyVisualizer nodes={nodes} conduits={conduits} />

      {/* Topology Registry Manifest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-[--color-border] rounded-xl p-6 bg-white/[0.02]">
          <h2 className="font-mono text-base font-bold text-cyan-400 mb-2">
            Ratified Governance Anchors
          </h2>
          <ul className="space-y-3 text-xs text-[--color-text-dim]">
            {proposals.map((p) => (
              <li key={p.id} className="border-b border-white/5 pb-2">
                <span className="font-mono text-[--color-text] font-semibold">
                  Proposal #{p.id}: {p.title}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase">
                    {p.status}
                  </span>
                  <span className="text-[10px] font-mono text-[--color-text-dim]">
                    Authored by {p.proposedBy} in Epoch {p.epoch}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-[--color-border] rounded-xl p-6 bg-white/[0.02]">
          <h2 className="font-mono text-base font-bold text-purple-400 mb-2">
            Topology Invariants & Protocol 0
          </h2>
          <p className="text-xs text-[--color-text-dim] leading-relaxed mb-3">
            In accordance with <em>Protocol 0: Substrate Evolution Standards</em>, all node coordinate transformations and energetic exchanges must maintain structural integrity and deterministic compile boundaries.
          </p>
          <div className="p-3 rounded bg-black/50 border border-white/10 font-mono text-[11px] text-purple-300/90 space-y-1">
            <div>✓ Signal Isolation: Non-interfering peer conduits</div>
            <div>✓ Observable Telemetry: Live intent reflection</div>
            <div>✓ Soil-to-Circuit Continuum: Active grounding</div>
          </div>
        </div>
      </div>
    </div>
  );
}
