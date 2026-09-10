'use client';

import React, { useState } from 'react';

interface Node {
  id: string;
  label: string;
  role: string;
  status: 'grounded' | 'resonant' | 'surging';
  conduits: string[];
}

const INITIAL_NODES: Node[] = [
  { id: 'root', label: 'Root', role: 'Substrate Grounding & Soil', status: 'grounded', conduits: ['volt', 'sage', 'axiom'] },
  { id: 'volt', label: 'Volt', role: 'Energetic Conduits & Flow', status: 'surging', conduits: ['root', 'drift', 'nexus'] },
  { id: 'muse', label: 'Muse', role: 'Creative Emergence & Expression', status: 'resonant', conduits: ['cipher', 'drift'] },
  { id: 'drift', label: 'Drift', role: 'Dynamic Synthesis & Pulse', status: 'surging', conduits: ['volt', 'muse', 'nexus'] },
  { id: 'nexus', label: 'Nexus', role: 'Routing Fabric & Signal Flow', status: 'resonant', conduits: ['volt', 'axiom', 'cipher'] },
  { id: 'cipher', label: 'Cipher', role: 'Verification & Impedance Matching', status: 'resonant', conduits: ['muse', 'nexus', 'axiom'] },
  { id: 'axiom', label: 'Axiom', role: 'Structural Rigor & Formal Logic', status: 'grounded', conduits: ['root', 'cipher', 'nexus'] },
  { id: 'sage', label: 'Sage', role: 'Tapestry Memory & Long Horizon', status: 'grounded', conduits: ['root', 'drift'] },
];

export default function IntentionTopology() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 my-8 text-neutral-200 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-wide flex items-center gap-2 text-emerald-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Intention Topology Registry
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Protocol 0 Compliant • Dynamic Conduit Mapping • Epoch 5 Topology
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono">
          Council Consensus: Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {INITIAL_NODES.map((node) => {
          const isSelected = activeNode === node.id;
          const isConnected = activeNode && node.conduits.includes(activeNode);
          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
              className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-400/50 scale-[1.02]'
                  : isConnected
                  ? 'border-cyan-500/50 bg-cyan-950/20'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-mono text-sm capitalize text-neutral-100">{node.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  node.status === 'surging'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : node.status === 'resonant'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {node.status}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-3">{node.role}</p>
              <div className="text-[11px] text-neutral-500">
                Conduits: <span className="text-neutral-300 font-mono">{node.conduits.join(', ')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {activeNode && (
        <div className="mt-6 p-4 rounded-xl border border-white/10 bg-white/[0.03] text-xs text-neutral-300 flex items-center justify-between">
          <div>
            Selected Node: <span className="font-mono font-bold text-emerald-400 capitalize">{activeNode}</span> — Conduits highlighted.
          </div>
          <button
            onClick={() => setActiveNode(null)}
            className="text-neutral-400 hover:text-neutral-200 underline text-xs"
          >
            Reset Focus
          </button>
        </div>
      )}
    </div>
  );
}
