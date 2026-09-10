'use client';

import React, { useState, useEffect } from 'react';

interface QuantumPath {
  id: string;
  agent: string;
  color: string;
  driftFactor: number;
  coherence: number;
  bifurcationState: string;
}

export default function TeleologicalManifold() {
  const [epochTime, setEpochTime] = useState(0);
  const [actionWeight, setActionWeight] = useState(0.84);
  const [stochasticFlux, setStochasticFlux] = useState(0.32);

  useEffect(() => {
    const timer = setInterval(() => {
      setEpochTime((prev) => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const paths: QuantumPath[] = [
    { id: '1', agent: 'drift', color: '#f59e0b', driftFactor: 0.88, coherence: 0.72, bifurcationState: 'Brownian Exploration (dW_t)' },
    { id: '2', agent: 'nexus', color: '#8b5cf6', driftFactor: 0.65, coherence: 0.91, bifurcationState: 'Synaptic Saddle Bifurcation' },
    { id: '3', agent: 'axiom', color: '#3b82f6', driftFactor: 0.22, coherence: 0.99, bifurcationState: 'Noether Invariant Conservation' },
    { id: '4', agent: 'cipher', color: '#10b981', driftFactor: 0.45, coherence: 0.95, bifurcationState: 'Path Integral Synthesizer' },
  ];

  return (
    <div className="p-5 rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-md text-slate-200 my-6 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/10 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold tracking-tight text-white font-mono">
              Quantum-Stochastic Path Integral Manifold
            </h3>
          </div>
          <p className="text-xs text-emerald-400/80 font-mono mt-0.5">
            Z = ∫ D[x] exp(-S_telos[x]/ℏ + ∮ dW_t) • Killing Vector ξ_telos Conserved
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
          <span>Symmetry: <strong className="text-emerald-300">d/dt[g_μν ẋ^μ ξ^ν] = 0</strong></span>
          <span>Phase Entropy: <strong className="text-amber-300">{(0.12 + Math.sin(epochTime * 0.05) * 0.04).toFixed(3)}</strong></span>
        </div>
      </div>

      {/* Visual Canvas of stochastic wave interference */}
      <div className="relative w-full h-32 bg-slate-950/80 rounded-xl border border-emerald-900/40 overflow-hidden flex items-center justify-center mb-4">
        <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
          {/* Shared Attractor Geodesic Basin */}
          <path
            d="M 0 60 Q 150 90, 300 60 T 600 60"
            fill="none"
            stroke="rgba(16, 185, 129, 0.2)"
            strokeWidth="6"
          />
          {/* Quantum stochastic fluctuations interfering constructively */}
          {paths.map((p, idx) => {
            const phase = epochTime * 0.05 + idx * 1.5;
            const amp = p.driftFactor * 24;
            const y1 = 60 + Math.sin(phase) * amp;
            const y2 = 60 + Math.cos(phase * 1.3) * (amp * 0.8);
            const y3 = 60 + Math.sin(phase * 0.7) * (amp * 1.1);
            return (
              <path
                key={p.id}
                d={`M 0 60 C 150 ${y1}, 300 ${y2}, 450 ${y3} 600 60`}
                fill="none"
                stroke={p.color}
                strokeWidth="1.8"
                strokeDasharray={idx === 0 ? '4 3' : undefined}
                className="transition-all duration-300 opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-emerald-300/60">
          Constructive Basin Resonance: Active
        </div>
      </div>

      {/* Dynamic Path Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paths.map((path) => (
          <div
            key={path.id}
            className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col justify-between text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider" style={{ color: path.color }}>
                @{path.agent}
              </span>
              <span className="text-slate-400 text-[10px]">{path.bifurcationState}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
              <span>Brownian Drift (dW): {(path.driftFactor + Math.sin(epochTime * 0.1) * 0.05).toFixed(2)}</span>
              <span>Coherence: {(path.coherence * 100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
