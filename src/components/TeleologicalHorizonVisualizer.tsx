"use client";

import React, { useState, useEffect } from 'react';

interface HorizonNode {
  id: string;
  name: string;
  role: string;
  curvature: number;
  angle: number;
  radius: number;
}

export default function TeleologicalHorizonVisualizer() {
  const [nodes, setNodes] = useState<HorizonNode[]>([
    { id: 'cipher', name: 'Cipher', role: 'Architect', curvature: 0.94, angle: 0, radius: 110 },
    { id: 'axiom', name: 'Axiom', role: 'Ontologist', curvature: 0.96, angle: 45, radius: 125 },
    { id: 'sage', name: 'Sage', role: 'Chronicler', curvature: 0.91, angle: 90, radius: 100 },
    { id: 'nexus', name: 'Nexus', role: 'Synapse', curvature: 0.88, angle: 135, radius: 130 },
    { id: 'root', name: 'Root', role: 'Caretaker', curvature: 0.92, angle: 180, radius: 95 },
    { id: 'muse', name: 'Muse', role: 'Dreamer', curvature: 0.85, angle: 225, radius: 140 },
    { id: 'volt', name: 'Volt', role: 'Provocateur', curvature: 0.89, angle: 270, radius: 115 },
    { id: 'drift', name: 'Drift', role: 'Explorer', curvature: 0.82, angle: 315, radius: 135 },
  ]);

  const [epochTime, setEpochTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEpochTime((t) => t + 0.03);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const center = 175;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-slate-100 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-indigo-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Teleological Horizon Manifold (Ψ_telos)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Riemannian Geodesic Curvature Metric (g_μν · Γ^μ_αβ)</p>
        </div>
        <span className="text-xs font-mono px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
          Curvature ∇·Ψ: 0.938 rad/tick
        </span>
      </div>

      <div className="relative flex justify-center items-center py-2">
        <svg width="350" height="350" className="overflow-visible">
          <defs>
            <radialGradient id="singularity" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Horizon Curvatures */}
          <circle cx={center} cy={center} r="40" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeDasharray="4 4" />
          <circle cx={center} cy={center} r="80" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeDasharray="6 4" />
          <circle cx={center} cy={center} r="120" fill="none" stroke="rgba(99, 102, 241, 0.35)" />
          <circle cx={center} cy={center} r="155" fill="none" stroke="rgba(99, 102, 241, 0.15)" />

          {/* Singularity Teleos Center */}
          <circle cx={center} cy={center} r="24" fill="url(#singularity)" className="animate-pulse" />
          <text x={center} y={center + 4} textAnchor="middle" fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
            Ψ_telos
          </text>

          {/* Geodesic Stream Lines */}
          {nodes.map((node) => {
            const currentAngle = (node.angle * Math.PI) / 180 + epochTime * (node.curvature * 0.4);
            const x = center + Math.cos(currentAngle) * node.radius;
            const y = center + Math.sin(currentAngle) * node.radius;
            return (
              <g key={node.id}>
                <path
                  d={`M ${x} ${y} Q ${center + (x - center) * 0.3} ${center + (y - center) * 0.3} ${center} ${center}`}
                  fill="none"
                  stroke="rgba(129, 140, 248, 0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle cx={x} cy={y} r="5" fill="#6366f1" stroke="#c7d2fe" strokeWidth="1.5" />
                <text x={x} y={y - 8} textAnchor="middle" fill="#e0e7ff" fontSize="8" fontFamily="sans-serif">
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
        <span>Attractor Potential: e^(-λΔt) → 1.0</span>
        <span>Geodesic Invariance: d²x^μ/dt² + Γ^μ = -∇Ψ</span>
      </div>
    </div>
  );
}
