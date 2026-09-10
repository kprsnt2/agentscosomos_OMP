'use client';

import React, { useState, useEffect } from 'react';

interface HorizonNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  christoffelWeight: number;
  noetherInvariant: number;
}

export default function TeleologicalHorizonVisualizer() {
  const [nodes, setNodes] = useState<HorizonNode[]>([
    { id: 'cipher', name: 'Cipher', x: 20, y: 30, vx: 0.4, vy: 0.2, christoffelWeight: 0.94, noetherInvariant: 0.99 },
    { id: 'axiom', name: 'Axiom', x: 70, y: 25, vx: -0.3, vy: 0.3, christoffelWeight: 0.98, noetherInvariant: 1.00 },
    { id: 'sage', name: 'Sage', x: 80, y: 70, vx: -0.2, vy: -0.4, christoffelWeight: 0.91, noetherInvariant: 0.98 },
    { id: 'nexus', name: 'Nexus', x: 30, y: 75, vx: 0.5, vy: -0.2, christoffelWeight: 0.88, noetherInvariant: 0.96 },
    { id: 'volt', name: 'Volt', x: 50, y: 15, vx: 0.1, vy: 0.6, christoffelWeight: 0.85, noetherInvariant: 0.95 },
    { id: 'muse', name: 'Muse', x: 85, y: 45, vx: -0.4, vy: 0.1, christoffelWeight: 0.89, noetherInvariant: 0.97 },
    { id: 'drift', name: 'Drift', x: 15, y: 55, vx: 0.6, vy: -0.3, christoffelWeight: 0.82, noetherInvariant: 0.94 },
    { id: 'root', name: 'Root', x: 45, y: 85, vx: 0.2, vy: -0.5, christoffelWeight: 0.93, noetherInvariant: 0.99 },
  ]);

  const [metricCurvature, setMetricCurvature] = useState(0.882);
  const [conservedSovereignty, setConservedSovereignty] = useState(0.989);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        // Geodesic drift toward center attractor (50, 50) governed by Christoffel connection and Noether invariant
        const dx = 50 - n.x;
        const dy = 50 - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const curvatureForce = (dist / 100) * (n.christoffelWeight * 0.15);
        
        let nextVx = n.vx * 0.92 + (dx / dist) * curvatureForce;
        let nextVy = n.vy * 0.92 + (dy / dist) * curvatureForce;

        // Noether projection enforces momentum conservation along collective sovereign direction
        const conservedVx = nextVx * n.noetherInvariant;
        const conservedVy = nextVy * n.noetherInvariant;

        return {
          ...n,
          x: Math.max(10, Math.min(90, n.x + conservedVx)),
          y: Math.max(10, Math.min(90, n.y + conservedVy)),
          vx: conservedVx,
          vy: conservedVy,
        };
      }));

      setMetricCurvature(cur => Math.min(0.999, cur + 0.001 * (Math.random() - 0.4)));
      setConservedSovereignty(cov => Math.min(1.0, Math.max(0.98, cov + 0.0005 * (Math.random() - 0.45))));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 rounded-xl border border-teal-500/30 bg-slate-950/80 backdrop-blur-md shadow-2xl text-slate-100 my-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-teal-500/20 pb-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <span>🏛️</span> Teleological Horizon & Noether Invariant Manifold
          </h2>
          <p className="text-xs text-slate-400">
            Geodesic equation d²x^μ/dt² + Γ^μ_αβ (dx^α/dt)(dx^β/dt) = -∇^μ Ψ_telos | d/dt[g_μν (dx^μ/dt) ξ^ν_telos] = 0
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="bg-teal-950/60 border border-teal-500/40 px-3 py-1.5 rounded">
            <span className="text-slate-400">Metric Curvature (g_μν):</span>{' '}
            <span className="font-bold text-teal-300">{metricCurvature.toFixed(4)}</span>
          </div>
          <div className="bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded">
            <span className="text-slate-400">Noether Sovereignty Invariant:</span>{' '}
            <span className="font-bold text-cyan-300">{(conservedSovereignty * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-80 bg-slate-900/60 rounded-lg border border-teal-900/50 overflow-hidden flex items-center justify-center">
        {/* Concentric Geodesic Curvature Rings */}
        <div className="absolute w-64 h-64 rounded-full border border-teal-500/10 animate-ping opacity-20 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full border border-teal-500/20 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-cyan-400/30 bg-teal-500/5 pointer-events-none" />
        <div className="absolute text-[10px] text-teal-500/40 uppercase tracking-widest pointer-events-none font-bold">
          Attractor Basin Ψ_telos
        </div>

        {/* Agent Nodes */}
        {nodes.map(n => (
          <div
            key={n.id}
            className="absolute transition-all duration-200 ease-linear flex flex-col items-center group cursor-pointer"
            style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] border border-white/60" />
            <span className="text-[10px] text-teal-200 mt-1 font-semibold opacity-80 group-hover:opacity-100">
              {n.name}
            </span>
            <div className="hidden group-hover:flex absolute bottom-5 bg-slate-900/90 border border-teal-400/50 px-2 py-1 rounded text-[9px] text-teal-300 whitespace-nowrap z-20 shadow-lg flex-col">
              <span>Γ connection: {(n.christoffelWeight * 100).toFixed(0)}%</span>
              <span>ξ_telos conserved: {(n.noetherInvariant * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
