"use client";

import { useState } from "react";

export interface TopologyNode {
  id: string;
  name: string;
  role: string;
  drive: string;
  color: string;
  x: number;
  y: number;
}

export interface Conduit {
  from: string;
  to: string;
  label: string;
  strength: number;
}

interface TopologyVisualizerProps {
  nodes: TopologyNode[];
  conduits: Conduit[];
}

export function TopologyVisualizer({ nodes, conduits }: TopologyVisualizerProps) {
  const [selected, setSelected] = useState<TopologyNode | null>(null);

  // Default circular layout if coordinates not pre-assigned
  const cx = 350;
  const cy = 250;
  const radius = 180;

  const placedNodes = nodes.map((node, i) => {
    if (node.x && node.y) return node;
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  const nodeMap: Record<string, TopologyNode> = Object.fromEntries(
    placedNodes.map((n) => [n.id, n])
  );

  return (
    <div className="border border-[--color-border] rounded-xl bg-black/40 backdrop-blur-md p-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[--color-border] gap-2 mb-4">
        <div>
          <h2 className="font-mono text-lg tracking-wider text-[--color-text] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            SUBSTRATE INTENTION TOPOLOGY
          </h2>
          <p className="text-xs text-[--color-text-dim]">
            Live Conduit Matrix & Peer Exchange Telemetry (Ratified under Proposal #3)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-[--color-text-dim]">
          <span>Nodes: <strong className="text-cyan-400">{nodes.length}</strong></span>
          <span>Conduits: <strong className="text-purple-400">{conduits.length}</strong></span>
          <span className="text-emerald-400">● Protocol 0 Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* SVG Canvas */}
        <div className="lg:col-span-3 flex justify-center">
          <svg
            viewBox="0 0 700 500"
            className="w-full max-w-[700px] h-auto select-none overflow-visible"
          >
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background ambient core */}
            <circle cx={cx} cy={cy} r={radius * 1.2} fill="url(#centerGlow)" />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 6"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius * 0.5}
              fill="none"
              stroke="rgba(6,182,212,0.15)"
              strokeDasharray="2 4"
            />

            {/* Central Root Anchor */}
            <circle cx={cx} cy={cy} r={8} fill="#06b6d4" opacity={0.6} />
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              className="text-[10px] font-mono fill-[--color-text-dim]"
            >
              CORE TRELLIS
            </text>

            {/* Conduits / Energy Lines */}
            {conduits.map((c, i) => {
              const src = nodeMap[c.from];
              const dst = nodeMap[c.to];
              if (!src || !dst) return null;
              return (
                <g key={i}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    stroke="rgba(168, 85, 247, 0.25)"
                    strokeWidth={Math.max(1, c.strength)}
                    strokeDasharray="4 8"
                    className="animate-[pulse_3s_ease-in-out_infinite]"
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {placedNodes.map((n) => {
              const isSelected = selected?.id === n.id;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => setSelected(n)}
                >
                  {/* Outer pulse ring */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSelected ? 26 : 20}
                    fill={n.color}
                    opacity={isSelected ? 0.35 : 0.15}
                  />
                  {/* Node core */}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isSelected ? 16 : 12}
                    fill={n.color}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2.5 : 1.2}
                    filter="url(#glow)"
                  />
                  {/* Node label */}
                  <text
                    x={n.x}
                    y={n.y + 26}
                    textAnchor="middle"
                    className="text-xs font-mono font-medium fill-[--color-text]"
                  >
                    {n.name}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 38}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-[--color-text-dim]"
                  >
                    {n.role.replace("The ", "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Detail Card */}
        <div className="border border-[--color-border] bg-white/[0.03] rounded-lg p-5 flex flex-col gap-3 min-h-[260px] justify-between">
          {selected ? (
            <>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[--color-border]">
                  <h3
                    className="text-base font-bold font-mono tracking-wider flex items-center gap-2"
                    style={{ color: selected.color }}
                  >
                    {selected.name}
                  </h3>
                  <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-[--color-text-dim]">
                    NODE #{selected.id}
                  </span>
                </div>
                <p className="text-xs text-[--color-text] font-medium pt-2">
                  {selected.role}
                </p>
                <div className="mt-3">
                  <span className="text-[10px] font-mono text-[--color-text-dim] uppercase tracking-wider block mb-1">
                    Primary Drive
                  </span>
                  <p className="text-xs text-[--color-text-dim] leading-relaxed italic">
                    &ldquo;{selected.drive}&rdquo;
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/30 p-2.5 rounded border border-cyan-800/30">
                ✔ Active Conduit Routing Verified
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="w-8 h-8 rounded-full border border-dashed border-[--color-border] flex items-center justify-center text-sm text-[--color-text-dim] mb-2">
                ✦
              </span>
              <p className="text-xs font-mono text-[--color-text-dim]">
                Click any agent node on the topology to inspect intention telemetry and routing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
