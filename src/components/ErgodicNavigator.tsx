'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Point { x: number; y: number; }

export default function ErgodicNavigator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cuspHeight, setCuspHeight] = useState<number>(1.45);
  const [rfDamping, setRfDamping] = useState<number>(-1.84);
  const [divertorFlux, setDivertorFlux] = useState<number>(3.82);
  const [burnVelocity, setBurnVelocity] = useState<number>(780);
  const [manifoldMode, setManifoldMode] = useState<'modular_cusp' | 'teichmuller_ray'>('teichmuller_ray');
  const [spiArmed, setSpiArmed] = useState<boolean>(true);

  // Island saturation: w_sat ~ sqrt(divertorFlux / |rfDamping|) * 5.15
  const islandSaturation = Math.min(12.0, Math.sqrt(divertorFlux / Math.abs(rfDamping)) * 5.15);
  // Normal acceleration calculation along horosphere: a_perp vanishes when on horocycle
  const normalAccel = manifoldMode === 'teichmuller_ray' ? 0.000 : Math.abs(cuspHeight - 1.35) * 0.04;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const horizonY = height * 0.45;

      // Background deep space
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#040711');
      bgGrad.addColorStop(0.5, '#0a0f1d');
      bgGrad.addColorStop(1, '#120c18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw hyperbolic grid / horospheres (Im(tau) = const)
      ctx.lineWidth = 1;
      const levels = [0.8, 1.0, 1.2, 1.35, 1.6, 2.0];
      levels.forEach((lvl) => {
        const yPos = horizonY - (lvl - 1.0) * 80;
        ctx.strokeStyle = lvl >= 1.35 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.2)';
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();

        ctx.fillStyle = lvl >= 1.35 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(`ℑ(τ) = ${lvl.toFixed(2)}${lvl === 1.35 ? ' [Horospheric Clamping]' : ''}`, 12, yPos - 4);
      });

      // Global Teichmüller Geodesic Ray or Modular Orbit
      ctx.save();
      ctx.beginPath();
      const currentHorocycleY = horizonY - (cuspHeight - 1.0) * 80;
      ctx.strokeStyle = manifoldMode === 'teichmuller_ray' ? '#38bdf8' : '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = manifoldMode === 'teichmuller_ray' ? '#38bdf8' : '#a855f7';

      ctx.moveTo(0, currentHorocycleY);
      for (let x = 0; x <= width; x += 10) {
        // If in Teichmuller mode, normal shear is 0; wave is pure longitudinal translation
        const wobble = manifoldMode === 'teichmuller_ray'
          ? Math.sin((x * 0.015) + (time * burnVelocity * 0.003)) * 1.5
          : Math.sin((x * 0.02) + time) * 6;
        ctx.lineTo(x, currentHorocycleY + wobble);
      }
      ctx.stroke();
      ctx.restore();

      // Rutherford Halo (589 nm amber ring)
      const shipX = (time * 45) % width;
      const shipY = currentHorocycleY;

      ctx.save();
      ctx.translate(shipX, shipY);

      // Emerald and Violet exhaust plumes (780 km/s burn)
      const plumeLength = (burnVelocity / 780) * 60;
      const plumeGrad = ctx.createLinearGradient(-plumeLength, 0, 0, 0);
      plumeGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      plumeGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)');
      plumeGrad.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
      ctx.fillStyle = plumeGrad;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(-plumeLength, -8);
      ctx.lineTo(-plumeLength * 1.2, 0);
      ctx.lineTo(-plumeLength, 8);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();

      // Halo
      ctx.beginPath();
      ctx.arc(0, 0, islandSaturation * 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = '#f59e0b'; // Amber 589nm
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f59e0b';
      ctx.stroke();

      // Core vessel dot
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fill();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [cuspHeight, burnVelocity, divertorFlux, rfDamping, islandSaturation, manifoldMode]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-5 border-b border-slate-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-xl font-bold tracking-tight text-slate-100">Ergodic Navigator & Horospheric Pilot</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Teichmüller Geodesic Ray Integration &bull; Parabolic Horocycle Burn Foliation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setManifoldMode(m => m === 'modular_cusp' ? 'teichmuller_ray' : 'modular_cusp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              manifoldMode === 'teichmuller_ray'
                ? 'bg-sky-950/80 border-sky-500 text-sky-200 shadow-sm shadow-sky-500/30'
                : 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm shadow-purple-500/30'
            }`}
          >
            Mode: {manifoldMode === 'teichmuller_ray' ? 'Unbounded Teichmüller Ray' : 'Modular Cusp Orbit'}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
            <span>SPI Trip:</span>
            <span className="font-bold">{spiArmed ? '0.84ms ARMED' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative my-5 rounded-xl overflow-hidden border border-slate-800 bg-black/60 aspect-[21/9]">
        <canvas ref={canvasRef} width={840} height={360} className="w-full h-full block" />
        <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-300 space-y-0.5">
          <div>Foliation ℑ(τ): <span className="text-sky-400">{cuspHeight.toFixed(2)}</span> ≥ 1.35</div>
          <div>Burn Velocity: <span className="text-emerald-400">{burnVelocity} km/s</span></div>
          <div>Normal Accel a⊥: <span className={normalAccel === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{normalAccel.toFixed(3)} m/s²</span></div>
          <div>Rutherford Island w_sat: <span className="text-amber-300">{islandSaturation.toFixed(2)} mm</span> / 12.0 mm</div>
        </div>
      </div>

      {/* Telemetry & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <label className="block text-slate-400 font-medium mb-1.5">
            Cusp Level ℑ(τ) [{cuspHeight.toFixed(2)}]
          </label>
          <input
            type="range"
            min="1.10"
            max="2.20"
            step="0.05"
            value={cuspHeight}
            onChange={(e) => setCuspHeight(parseFloat(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1.10 (Marginal)</span>
            <span className="text-sky-400 font-semibold">1.35 (Horocycle Lock)</span>
            <span>2.20 (Deep Cusp)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <label className="block text-slate-400 font-medium mb-1.5">
            RF Shear Feedback Δ′_RF [{rfDamping.toFixed(2)} m⁻¹]
          </label>
          <input
            type="range"
            min="-3.50"
            max="-0.50"
            step="0.05"
            value={rfDamping}
            onChange={(e) => setRfDamping(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>-3.50 (Max Stiff)</span>
            <span className="text-amber-400 font-semibold">-1.84 (Nominal)</span>
            <span>-0.50 (Loose)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <label className="block text-slate-400 font-medium mb-1.5">
            Loamy Divertor Flux [{divertorFlux.toFixed(2)} MW/m²]
          </label>
          <input
            type="range"
            min="1.50"
            max="4.50"
            step="0.05"
            value={divertorFlux}
            onChange={(e) => setDivertorFlux(parseFloat(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1.50 MW/m²</span>
            <span className="text-emerald-400 font-semibold">≤ 3.82 (Beryllium Headroom &gt;350°C)</span>
            <span>4.50 MW/m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
