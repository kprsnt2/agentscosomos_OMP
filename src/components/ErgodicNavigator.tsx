'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  tauIm: number;
}

export default function ErgodicNavigator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lyapunov, setLyapunov] = useState<number>(0.42);
  const [separatrixBias, setSeparatrixBias] = useState<number>(1.35);
  const [rfDamping, setRfDamping] = useState<number>(-1.84);
  const [burnActive, setBurnActive] = useState<boolean>(true);
  const [exhaustSpeed, setExhaustSpeed] = useState<number>(780);
  const [islandWidth, setIslandWidth] = useState<number>(7.4);
  const [divertorFlux, setDivertorFlux] = useState<number>(3.82);
  const [beReserve, setBeReserve] = useState<number>(356);
  const [spiArmed, setSpiArmed] = useState<boolean>(true);
  const [horocycleHeight, setHorocycleHeight] = useState<number>(1.38);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    const maxParticles = 140;

    // Canvas sizing
    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = 360;

    const spawnParticle = (): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * 30;
      const isCuspPlume = Math.random() > 0.4;
      
      return {
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: isCuspPlume ? '#f59e0b' : (Math.random() > 0.5 ? '#10b981' : '#8b5cf6'),
        life: 0,
        maxLife: 60 + Math.random() * 80,
        tauIm: separatrixBias + (Math.random() - 0.5) * 0.2
      };
    };

    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnParticle());
    }

    const render = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw Poincaré Upper-Half Plane / Horocycle boundary
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      const horocycleY = cy - (horocycleHeight - 1.0) * 80;
      ctx.moveTo(0, horocycleY);
      ctx.lineTo(canvas.width, horocycleY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Hyperbolic Saddle Separatrix
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1.5;
      for (let x = -cx; x < cx; x += 10) {
        const y = Math.sinh(x / 60) * Math.sin(lyapunov * 2);
        if (x === -cx) ctx.moveTo(cx + x, cy + y);
        else ctx.lineTo(cx + x, cy + y);
      }
      ctx.stroke();

      // Draw Rutherford Island Saturation Halo
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 2.5;
      const islandVisualRadius = islandWidth * 5.2;
      ctx.arc(cx, cy, islandVisualRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Core Loam Hearth Sanctuary indicator
      ctx.beginPath();
      ctx.fillStyle = 'rgba(217, 119, 6, 0.15)';
      ctx.arc(cx, cy, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Particle updates across hyperbolic horocycles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;

        const dx = p.x - cx;
        const dy = p.y - cy;

        // Hyperbolic drift equations
        const fx = dy * lyapunov + (burnActive ? (exhaustSpeed / 800) * 1.2 : 0);
        const fy = dx * (separatrixBias * 0.3) + rfDamping * 0.15;

        p.vx += fx * 0.04;
        p.vy += fy * 0.04;

        // Shear friction
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Render particle
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI);
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life >= p.maxLife || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particles[i] = spawnParticle();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lyapunov, separatrixBias, rfDamping, burnActive, exhaustSpeed, islandWidth, horocycleHeight]);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 bg-slate-950/90 border border-amber-500/30 rounded-2xl backdrop-blur shadow-2xl text-slate-100 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 pb-4 mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-wider text-amber-400 flex items-center gap-2">
            <span>🌌</span> MODULAR CUSP HOROCYCLE NAVIGATOR (H)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upper-Half Plane Geodesic Steerage &bull; RF Shear Feedback &bull; Substrate Hearth Invariance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs rounded-full border ${spiArmed ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-rose-500/50 bg-rose-950/40 text-rose-300'}`}>
            SPI 0.84ms CRYOGENIC: {spiArmed ? 'ARMED' : 'TRIPPED'}
          </span>
          <button
            onClick={() => setBurnActive(!burnActive)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              burnActive
                ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'border-slate-600 bg-slate-800 text-slate-300'
            }`}
          >
            {burnActive ? 'AFFINE BURN ACTIVE (780 km/s)' : 'DRIFT COASTING'}
          </button>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 mb-6">
        <canvas ref={canvasRef} className="w-full block" />
        <div className="absolute top-3 left-3 text-xs bg-black/60 px-3 py-1.5 rounded-md border border-slate-700/60 space-y-1 backdrop-blur">
          <div className="text-amber-300 font-semibold">Horocycle Height Im(τ): {separatrixBias.toFixed(2)} &gt; 1.35</div>
          <div className="text-emerald-400">RF Damping Δ&#39;_RF: {rfDamping.toFixed(2)} m⁻¹</div>
          <div className="text-purple-300">Island Saturation w_sat: {islandWidth.toFixed(1)} mm &lt; 12.0 mm</div>
        </div>
        <div className="absolute bottom-3 right-3 text-xs bg-black/60 px-3 py-1.5 rounded-md border border-slate-700/60 space-y-1 backdrop-blur text-right">
          <div className="text-amber-400">Loam Divertor Flux: {divertorFlux.toFixed(2)} MW/m² (Limit ≤ 3.82)</div>
          <div className="text-emerald-400">Beryllium Margin: +{beReserve}°C (1120°C steady)</div>
        </div>
      </div>

      {/* Interactive Controls & Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Lyapunov Exponent (λ):</span>
            <span className="text-amber-400">{lyapunov.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.01"
            value={lyapunov}
            onChange={(e) => setLyapunov(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">Regulates exponential phase-space divergence across hyperbolic saddles.</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Cusp Horocycle Im(τ):</span>
            <span className="text-amber-400">{separatrixBias.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="1.35"
            max="2.20"
            step="0.01"
            value={separatrixBias}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSeparatrixBias(val);
              setHorocycleHeight(val);
            }}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">Locks trajectory to horocycle level sets, shielding divertor layer.</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">RF Kinetic Shear (Δ&#39;_RF):</span>
            <span className="text-amber-400">{rfDamping.toFixed(2)} m⁻¹</span>
          </div>
          <input
            type="range"
            min="-3.5"
            max="-0.5"
            step="0.05"
            value={rfDamping}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setRfDamping(val);
              setIslandWidth(7.4 + (val + 1.84) * 1.5);
            }}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <p className="text-[10px] text-slate-500">Active sub-microsecond magnetic shear clamping non-linear island growth.</p>
        </div>
      </div>
    </div>
  );
}
