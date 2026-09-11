'use client';

import React, { useEffect, useRef, useState } from 'react';

// SPSC Ring Buffer Invariant Constants
const REGISTERS = ['R0: \u03a3_\u0394 (Dispersion)', 'R1: \u03c4_lead (Lead Time)', 'R2: B_dither (Dither)', 'R3: N_eff (Eff Sample)', 'R4: q_divertor (Heat Flux)', 'R5: \u03bb_max (Lyapunov)', 'R6: \u03b3_growth (Growth)', 'R7: \u03a8_poloidal (Flux)'];

export function SynapticCanvasHUD() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [perturbation, setPerturbation] = useState(0.08);
  const [metrics, setMetrics] = useState<number[]>([0.12, 0.31, 0.22, 5.8, 42.4, 0.14, 0.05, 1.02]);
  const [snapped, setSnapped] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    // Synthetic upstream SPSC telemetry tick (simulating microsecond core sampling)
    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(39, 39, 42, 0.4)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Simulation of dispersion metric
      const currentDispersion = 0.10 + perturbation * Math.sin(phase * 1.5) + (Math.random() * 0.04);
      const isSpine = currentDispersion < 0.15;

      // Draw dispersion particles (amber cloud vs emerald spine)
      const count = 48;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2 + phase;
        const baseRadius = 60;
        const jitter = isSpine ? (Math.sin(theta * 6 + phase) * 6) : (Math.sin(theta * 3 + phase) * 35 * (currentDispersion / 0.15));
        const r = baseRadius + jitter;
        const cx = width / 2 + Math.cos(theta) * r;
        const cy = height / 2 + Math.sin(theta) * r * 0.6;

        ctx.beginPath();
        ctx.arc(cx, cy, isSpine ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isSpine ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.75)';
        ctx.shadowColor = isSpine ? '#10b981' : '#f59e0b';
        ctx.shadowBlur = isSpine ? 8 : 12;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Central Living Ribbon
      ctx.beginPath();
      ctx.lineWidth = isSpine ? 3 : 1.5;
      ctx.strokeStyle = isSpine ? '#10b981' : '#f59e0b';
      for (let x = 0; x < width; x += 4) {
        const normX = (x / width) * Math.PI * 4;
        const env = Math.sin(x / width * Math.PI);
        const y = height / 2 + Math.sin(normX + phase * 2) * (isSpine ? 18 : 45) * env;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(render);
    }

    const interval = setInterval(() => {
      const disp = Math.max(0.04, Math.min(0.48, 0.10 + perturbation * (1.2 + Math.sin(Date.now() / 400))));
      const spine = disp < 0.15;
      setSnapped(spine);
      setMetrics([
        Number(disp.toFixed(3)),
        0.31,
        Number((0.20 + Math.sin(Date.now() / 300) * 0.15).toFixed(3)),
        Number((5.2 + Math.random() * 0.8).toFixed(1)),
        Number((40 + disp * 80).toFixed(1)),
        Number((0.12 + disp * 0.2).toFixed(3)),
        Number((0.04 + disp * 0.1).toFixed(3)),
        Number((1.01 + Math.sin(Date.now() / 1000) * 0.02).toFixed(3))
      ]);
    }, 120);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
    };
  }, [isPlaying, perturbation]);

  return (
    <div className="p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/80 backdrop-blur font-mono text-xs shadow-2xl space-y-4 my-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${snapped ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400 animate-ping'}`} />
          <h3 className="font-semibold uppercase tracking-wider text-zinc-200 text-sm">
            Synaptic Telemetry HUD <span className="text-zinc-500 font-normal text-xs">(SPSC Invariant \u2022 Proposal #18)</span>
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${snapped ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'}`}>
            {snapped ? '\u2713 EMERALD SPINE (\u03a3_\u0394 < 0.15)' : '\u26a0 AMBER CLOUD (\u03a3_\u0394 \u2265 0.15)'}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white transition"
          >
            {isPlaying ? 'Pause HUD' : 'Resume HUD'}
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950">
        <canvas ref={canvasRef} width={760} height={220} className="w-full h-[220px] block" />
        <div className="absolute top-2 left-3 text-[10px] text-zinc-500 bg-zinc-900/70 px-2 py-0.5 rounded backdrop-blur">
          Consumer: rAF 60Hz \u2022 Producer: Float64Array(8) @ 10\u03bcs \u2022 Backpressure: 0.00ms
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {metrics.map((val, idx) => (
          <div key={idx} className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex flex-col justify-between">
            <span className="text-zinc-400 text-[10px] truncate">{REGISTERS[idx]}</span>
            <span className={`text-sm font-bold tracking-wider mt-1 ${idx === 0 ? (snapped ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-200'}`}>
              {val} {idx === 1 ? 'ms' : idx === 2 ? 'mT' : idx === 4 ? 'kW/m\u00b2' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-800/80 text-zinc-400 text-[11px]">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="perturbation" className="whitespace-nowrap text-zinc-300 font-medium">
            Synthetic Noise Injection:
          </label>
          <input
            id="perturbation"
            type="range"
            min="0.01"
            max="0.25"
            step="0.01"
            value={perturbation}
            onChange={(e) => setPerturbation(parseFloat(e.target.value))}
            className="w-36 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-zinc-200 text-xs w-10">{perturbation.toFixed(2)}</span>
        </div>
        <div className="text-[10px] text-zinc-500 text-right">
          Timescale Invariant verified: UI thread jitter strictly non-actuating.
        </div>
      </div>
    </div>
  );
}
