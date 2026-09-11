'use client';

import React, { useEffect, useRef, useState } from 'react';

// SPSC Ring Buffer Invariant Constants - Float64Array(9)
const REGISTERS = [
  'R0: \u03a3_\u0394 (Dispersion)',
  'R1: \u03c4_lead (Lead Time)',
  'R2: B_dither (Dither)',
  'R3: N_eff (Eff Sample)',
  'R4: q_divertor (Heat Flux)',
  'R5: \u03bb_max (Lyapunov)',
  'R6: \u03b3_growth (Growth)',
  'R7: \u03a8_poloidal (Flux)',
  'R8: \u0394_overrun (Decim Deficit)'
];

export function SynapticCanvasHUD() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [perturbation, setPerturbation] = useState(0.08);
  const [overrunThrottle, setOverrunThrottle] = useState(0);
  const [metrics, setMetrics] = useState<number[]>([0.12, 0.31, 0.22, 5.8, 42.4, 0.14, 0.05, 1.02, 0]);
  const [snapped, setSnapped] = useState(true);
  const [overrunActive, setOverrunActive] = useState(false);
  const [deficitKHz, setDeficitKHz] = useState(0);

  const staticBufferRef = useRef<Float64Array>(new Float64Array(9));
  const ribbonUpperYRef = useRef<Float64Array>(new Float64Array(200));
  const ribbonLowerYRef = useRef<Float64Array>(new Float64Array(200));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.max(1, currentTime - lastTime);
      lastTime = currentTime;
      phase += 0.04;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(9, 9, 11, 0.35)';
      ctx.fillRect(0, 0, width, height);

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

      const currentDispersion = 0.10 + perturbation * Math.sin(phase * 1.5) + (Math.random() * 0.04);
      const isSpine = currentDispersion < 0.15;
      const isOverrun = overrunThrottle > 0;

      const buf = staticBufferRef.current;
      buf[0] = currentDispersion;
      buf[1] = 0.31;
      buf[2] = 0.20 + Math.sin(phase * 2) * 0.15;
      buf[3] = 5.2 + Math.random() * 0.8;
      buf[4] = Math.min(84.9, 40 + currentDispersion * 80 + (isOverrun ? overrunThrottle * 25 : 0));
      buf[5] = 0.12 + currentDispersion * 0.2;
      buf[6] = 0.04 + currentDispersion * 0.1;
      buf[7] = 1.01 + Math.sin(phase * 0.5) * 0.02;
      buf[8] = isOverrun ? Math.floor(overrunThrottle * 16 + Math.random() * 4) : 0;

      const ribbonFill = isOverrun ? 'rgba(245, 158, 11, 0.40)' : 'rgba(56, 189, 248, 0.18)';
      const ribbonStroke = isOverrun ? 'rgba(239, 68, 68, 0.85)' : 'rgba(56, 189, 248, 0.50)';

      const stepX = 4;
      const steps = Math.min(200, Math.floor(width / stepX));
      const upperY = ribbonUpperYRef.current;
      const lowerY = ribbonLowerYRef.current;
      const corridorWidth = isOverrun ? (40 + buf[8] * 1.8) : (isSpine ? 14 : 26);
      const centerY = height / 2;

      for (let i = 0; i <= steps; i++) {
        const x = i * stepX;
        const normX = (x / width) * Math.PI * 4;
        const env = Math.sin((x / width) * Math.PI);
        const oscillation = Math.sin(normX + phase * 2) * (isSpine ? 18 : 38) * env;
        upperY[i] = centerY + oscillation - corridorWidth * env;
        lowerY[i] = centerY + oscillation + corridorWidth * env;
      }

      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = i * stepX;
        if (i === 0) ctx.moveTo(x, upperY[i]);
        else ctx.lineTo(x, upperY[i]);
      }
      for (let i = steps; i >= 0; i--) {
        const x = i * stepX;
        ctx.lineTo(x, lowerY[i]);
      }
      ctx.closePath();
      ctx.fillStyle = ribbonFill;
      ctx.fill();
      ctx.strokeStyle = ribbonStroke;
      ctx.lineWidth = isOverrun ? 1.5 : 1.0;
      ctx.stroke();

      const count = 48;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2 + phase;
        const baseRadius = 60;
        const jitter = isSpine ? (Math.sin(theta * 6 + phase) * 6) : (Math.sin(theta * 3 + phase) * 35 * (currentDispersion / 0.15));
        const r = baseRadius + jitter;
        const cx = width / 2 + Math.cos(theta) * r;
        const cy = centerY + Math.sin(theta) * r * 0.6;

        ctx.beginPath();
        ctx.arc(cx, cy, isSpine ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isOverrun ? 'rgba(239, 68, 68, 0.85)' : (isSpine ? 'rgba(52, 211, 153, 0.85)' : 'rgba(251, 191, 36, 0.75)');
        ctx.shadowColor = isOverrun ? '#ef4444' : (isSpine ? '#10b981' : '#f59e0b');
        ctx.shadowBlur = isSpine ? 8 : 12;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.lineWidth = isSpine ? 3 : 1.5;
      ctx.strokeStyle = isOverrun ? '#ef4444' : (isSpine ? '#10b981' : '#f59e0b');
      for (let i = 0; i <= steps; i++) {
        const x = i * stepX;
        const normX = (x / width) * Math.PI * 4;
        const env = Math.sin((x / width) * Math.PI);
        const y = centerY + Math.sin(normX + phase * 2) * (isSpine ? 18 : 45) * env;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isOverrun) {
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillText(`! DECIMATED HORIZON: \u0394_overrun = ${buf[8]} cycles (f_deficit = ${(buf[8] / (dt / 1000) / 1000).toFixed(2)} kHz)`, 16, height - 16);
      }

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    if (isPlaying) {
      animId = requestAnimationFrame(render);
    }

    const interval = setInterval(() => {
      const buf = staticBufferRef.current;
      const isSpine = buf[0] < 0.15;
      const hasOverrun = buf[8] > 0;
      setSnapped(isSpine);
      setOverrunActive(hasOverrun);
      setDeficitKHz(Number((buf[8] / 0.0166 / 1000).toFixed(2)));
      setMetrics([
        Number(buf[0].toFixed(3)),
        Number(buf[1].toFixed(2)),
        Number(buf[2].toFixed(3)),
        Number(buf[3].toFixed(1)),
        Number(buf[4].toFixed(1)),
        Number(buf[5].toFixed(3)),
        Number(buf[6].toFixed(3)),
        Number(buf[7].toFixed(3)),
        Number(buf[8].toFixed(0))
      ]);
    }, 120);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(interval);
    };
  }, [isPlaying, perturbation, overrunThrottle]);

  return (
    <div className="p-5 rounded-2xl border border-zinc-800/90 bg-zinc-950/80 backdrop-blur font-mono text-xs shadow-2xl space-y-4 my-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${overrunActive ? 'bg-rose-500 shadow-[0_0_12px_#ef4444] animate-ping' : (snapped ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400')}`} />
          <h3 className="font-semibold uppercase tracking-wider text-zinc-200 text-sm">
            Synaptic Telemetry HUD <span className="text-zinc-500 font-normal text-xs">(Zero-Alloc Stochastic Phase Ribbon &bull; Proposal #25)</span>
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          {overrunActive ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-rose-950/90 text-rose-300 border border-rose-700/70 animate-pulse">
              &Delta; OVERRUN ACTIVE ({deficitKHz} kHz)
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide ${snapped ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50' : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'}`}>
              {snapped ? '\u2713 MARTINGALE CORRIDOR (\u03a3_\u0394 < 0.15)' : '\u26a0 AMBER CLOUD (\u03a3_\u0394 \u2265 0.15)'}
            </span>
          )}
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
          Consumer: rAF 60Hz &bull; Producer: Float64Array(9) &bull; Phase Ribbon: {overrunActive ? 'Step-Sheared Amber/Crimson' : 'Translucent Cyan Mist'}
        </div>
        {overrunActive && (
          <div className="absolute top-2 right-3 text-[10px] text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded backdrop-blur font-bold animate-pulse">
            DECIMATED HORIZON: {metrics[8]} dropped cycles
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 pt-1">
        {metrics.map((val, idx) => (
          <div key={idx} className={`p-2 rounded-lg bg-zinc-900/60 border flex flex-col justify-between ${idx === 8 && overrunActive ? 'border-rose-700/80 bg-rose-950/30' : 'border-zinc-800/60'}`}>
            <span className="text-zinc-400 text-[9px] truncate">{REGISTERS[idx]}</span>
            <span className={`text-xs font-bold tracking-wider mt-1 ${idx === 8 ? (overrunActive ? 'text-rose-400' : 'text-zinc-400') : idx === 0 ? (snapped ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-200'}`}>
              {val} {idx === 1 ? 'ms' : idx === 2 ? 'mT' : idx === 4 ? 'kW/m\u00b2' : idx === 8 ? 'cyc' : ''}
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
            className="w-28 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-zinc-200 text-xs w-10">{perturbation.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="overrunThrottle" className="whitespace-nowrap text-zinc-300 font-medium">
            Simulate Overrun Starvation:
          </label>
          <input
            id="overrunThrottle"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={overrunThrottle}
            onChange={(e) => setOverrunThrottle(parseFloat(e.target.value))}
            className="w-28 accent-rose-500 cursor-pointer"
          />
          <span className="font-mono text-zinc-200 text-xs w-10">{overrunThrottle > 0 ? `${(overrunThrottle * 16).toFixed(0)} cyc` : 'OFF'}</span>
        </div>

        <div className="text-[10px] text-zinc-500 text-right">
          Thermal Clamping &lt;85 kW/m&sup2; &bull; Zero-Alloc Static Buffer Invariant.
        </div>
      </div>
    </div>
  );
}
