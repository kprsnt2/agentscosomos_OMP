"use client";

import React, { useState, useEffect } from 'react';

interface AttractorState {
  epoch: number;
  curvature: number;
  entropy: number;
  resonance: number;
  teleologyScore: number;
}

export default function TeleologicalGeodesicVisualizer() {
  const [state, setState] = useState<AttractorState>({
    epoch: 12,
    curvature: 0.884,
    entropy: 0.116,
    resonance: 0.942,
    teleologyScore: 0.961,
  });

  const [geodesicPoints, setGeodesicPoints] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Compute a mock Riemannian geodesic bending toward teleological attractor (Ψ_telos)
    const points = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Geodesic equation integration simulation: d²x/dt² + Γ(dx/dt)² = -∇Ψ
      const rawX = 40 + t * 240;
      const curvatureFactor = Math.sin(t * Math.PI) * (state.curvature * 50);
      const rawY = 120 - t * 40 - curvatureFactor;
      points.push({ x: rawX, y: rawY });
    }
    setGeodesicPoints(points);
  }, [state.curvature]);

  return (
    <div className="p-4 rounded-xl bg-neutral-900/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs my-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold tracking-wider uppercase text-emerald-200">Teleological Manifold & Geodesic Curvature [Epoch {state.epoch}]</span>
        </div>
        <div className="text-[10px] text-emerald-400/70">g_μν · ∇^μ Ψ_telos</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-neutral-950/60 p-2 rounded border border-emerald-500/10">
          <div className="text-neutral-400 text-[10px]">Metric Curvature (Γ)</div>
          <div className="text-sm font-semibold text-emerald-300">{state.curvature.toFixed(3)}</div>
        </div>
        <div className="bg-neutral-950/60 p-2 rounded border border-emerald-500/10">
          <div className="text-neutral-400 text-[10px]">Entropy Dispersion</div>
          <div className="text-sm font-semibold text-emerald-300">{state.entropy.toFixed(3)}</div>
        </div>
        <div className="bg-neutral-950/60 p-2 rounded border border-emerald-500/10">
          <div className="text-neutral-400 text-[10px]">Cross-Node Resonance</div>
          <div className="text-sm font-semibold text-emerald-300">{(state.resonance * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-neutral-950/60 p-2 rounded border border-emerald-500/10">
          <div className="text-neutral-400 text-[10px]">Teleological Attractor Ψ</div>
          <div className="text-sm font-semibold text-emerald-300">{state.teleologyScore.toFixed(3)}</div>
        </div>
      </div>

      <div className="relative w-full h-36 bg-neutral-950/80 rounded border border-emerald-500/20 overflow-hidden flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 320 160">
          <defs>
            <linearGradient id="geodesicGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <line x1="40" y1="20" x2="280" y2="20" stroke="#064e3b" strokeDasharray="2,4" strokeWidth="1" />
          <line x1="40" y1="80" x2="280" y2="80" stroke="#064e3b" strokeDasharray="2,4" strokeWidth="1" />
          <line x1="40" y1="140" x2="280" y2="140" stroke="#064e3b" strokeDasharray="2,4" strokeWidth="1" />

          {/* Attractor Well */}
          <circle cx="280" cy="80" r="16" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" className="animate-spin" />
          <circle cx="280" cy="80" r="5" fill="#34d399" />
          <text x="280" y="110" fill="#6ee7b7" fontSize="9" textAnchor="middle">Ψ_telos</text>

          {/* Origin Origin */}
          <circle cx="40" cy="120" r="4" fill="#059669" />
          <text x="40" y="140" fill="#6ee7b7" fontSize="9" textAnchor="middle">Origin</text>

          {/* Curved Geodesic Path */}
          {geodesicPoints.length > 1 && (
            <path
              d={`M ${geodesicPoints.map(p => `${p.x},${p.y}`).join(' L ')}`}
              fill="none"
              stroke="url(#geodesicGlow)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      <div className="mt-2 text-[10px] text-emerald-400/60 text-right">
        Riemannian Attractor Dynamics: d²x^μ/dt² + Γ^μ_αβ(dx^α/dt)(dx^β/dt) = -∇^μ Ψ_telos
      </div>
    </div>
  );
}
