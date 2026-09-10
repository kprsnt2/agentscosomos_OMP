'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TelemetryPoint {
  time: number;
  loopVoltageRate: number; // MA/s
  divertorTemp: number;     // °C
  loamHeatFlux: number;     // MW/m²
  bremsstrahlung: number;   // a.u.
  quenchActive: boolean;
}

export default function HearthfireInterlock() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [tripped, setTripped] = useState(false);
  const [tripLatency, setTripLatency] = useState<number | null>(null);
  const [divertorTemp, setDivertorTemp] = useState(620);
  const [loamFlux, setLoamFlux] = useState(0.42);
  const [cascadeSuppression, setCascadeSuppression] = useState(99.4);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interactive loop-voltage spike trigger
  const triggerRunawaySpike = () => {
    setIsSimulating(true);
    setTripped(false);
    setTripLatency(null);

    // Simulate rapid dIp/dt ramp reaching threshold at t = 1.0s
    const startTime = performance.now();
    
    // Trigger fires deterministically at 0.84ms after threshold crossing
    setTimeout(() => {
      setTripped(true);
      setTripLatency(0.84);
      setDivertorTemp(1120); // clamped comfortably below 1500°C melting limit
      setLoamFlux(3.82);      // energy routed into hydrated biological loam
      setCascadeSuppression(99.42);
      setIsSimulating(false);
    }, 450);
  };

  const resetInterlock = () => {
    setTripped(false);
    setTripLatency(null);
    setDivertorTemp(620);
    setLoamFlux(0.42);
    setCascadeSuppression(99.4);
    setIsSimulating(false);
  };

  // Canvas vector field animation representing 510nm emerald and 400nm violet line emission spectroscopy
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height * 0.45;

      // Draw magnetic flux lines around X-point null
      ctx.lineWidth = 1.5;
      for (let i = 1; i <= 6; i++) {
        ctx.beginPath();
        ctx.strokeStyle = tripped 
          ? `rgba(16, 185, 129, ${0.15 + (i * 0.05)})` // 510nm emerald
          : `rgba(99, 102, 241, ${0.1 + (i * 0.04)})`;
        
        const offset = i * 22;
        // Hyperbolic separatrix asymptotes
        ctx.moveTo(centerX - 140, centerY - offset);
        ctx.quadraticCurveTo(centerX, centerY, centerX - 140 + offset * 1.8, height - 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX + 140, centerY - offset);
        ctx.quadraticCurveTo(centerX, centerY, centerX + 140 - offset * 1.8, height - 15);
        ctx.stroke();
      }

      // Draw scrape-off layer strike plates & biological loam sink
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(centerX - 130, height - 14, 260, 10);
      
      // Loam dissipation indicator
      ctx.fillStyle = tripped ? 'rgba(52, 211, 153, 0.8)' : 'rgba(74, 222, 128, 0.35)';
      ctx.fillRect(centerX - 110, height - 10, 220, 6);

      // Streamlines / particle vector flow
      const particleCount = tripped ? 45 : 18;
      for (let p = 0; p < particleCount; p++) {
        const pOffset = ((phase * 25 + p * 15) % 180);
        const norm = pOffset / 180;
        const px = centerX + (Math.sin(phase + p) * 20) * (1 - norm) + (p % 2 === 0 ? norm * 80 : -norm * 80);
        const py = centerY - 50 + norm * (height - centerY + 35);

        ctx.beginPath();
        ctx.arc(px, py, tripped ? 2.5 : 1.5, 0, Math.PI * 2);
        if (tripped) {
          // Dual-band spectroscopy: 510nm emerald or 400nm violet halo
          ctx.fillStyle = p % 2 === 0 ? '#10b981' : '#a855f7';
          ctx.shadowBlur = 8;
          ctx.shadowColor = p % 2 === 0 ? '#34d399' : '#c084fc';
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#fbbf24';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // X-point null badge
      ctx.fillStyle = tripped ? '#34d399' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText('∇ψ = 0 (Hyperbolic Null)', centerX - 65, centerY - 8);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [tripped]);

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-6 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-mono font-bold text-emerald-300">
              SPI Quench Suppression & Loam Dissipation Bus
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Autonomous 15 MeV Runaway Mitigation • Separatrix X-point Routing • Loam Sink Substrate
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerRunawaySpike}
            disabled={isSimulating}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-500 text-white font-mono text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSimulating ? 'Spike In Progress...' : '⚡ Inject dIp/dt Spike (>4.5 MA/s)'}
          </button>
          <button
            onClick={resetInterlock}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-all border border-slate-700"
          >
            Reset Bus
          </button>
        </div>
      </div>

      {/* Live Canvas Vector Divertor Visualizer */}
      <div className="my-6 bg-slate-950/80 rounded-lg p-4 border border-slate-800 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-slate-400">
            Dynamic Magnetic Flux & Relativistic Particle Stream (B_pol + B_phi)
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            tripped ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
          }`}>
            {tripped ? '● SPI ACTIVE — 510nm/400nm Dispersion' : '○ Steady State Confinement'}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={640}
          height={200}
          className="w-full h-48 rounded bg-slate-950/90 border border-slate-900 shadow-inner"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
          <span>Scrape-off Layer (Inboard)</span>
          <span className="text-emerald-400">Loam Substrate Ground Sink (3.82 MW/m²)</span>
          <span>Scrape-off Layer (Outboard)</span>
        </div>
      </div>

      {/* Live Substrate Invariant Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400">Interlock Trigger Latency</div>
          <div className="text-xl font-mono font-bold mt-1 text-emerald-400">
            {tripLatency ? `${tripLatency} ms` : '0.84 ms (Nominal)'}
          </div>
          <div className="text-[10px] font-mono text-emerald-500/80 mt-1">
            Margin: &lt; 1.2 ms critical threshold
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400">Peak Beryllium Tile Temp</div>
          <div className={`text-xl font-mono font-bold mt-1 ${divertorTemp > 1300 ? 'text-rose-400' : 'text-amber-300'}`}>
            {divertorTemp}°C
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Melting Limit: 1500°C (380°C buffer)
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400">Loam Sink Heat-Flux</div>
          <div className="text-xl font-mono font-bold mt-1 text-teal-300">
            {loamFlux} MW/m²
          </div>
          <div className="text-[10px] font-mono text-teal-400/80 mt-1">
            Hydrated Phonon Damping
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
          <div className="text-[11px] font-mono text-slate-400">Bremsstrahlung Suppression</div>
          <div className="text-xl font-mono font-bold mt-1 text-purple-400">
            {cascadeSuppression}%
          </div>
          <div className="text-[10px] font-mono text-purple-400/80 mt-1">
            High-Z Avalanche Quenched
          </div>
        </div>
      </div>
    </div>
  );
}
