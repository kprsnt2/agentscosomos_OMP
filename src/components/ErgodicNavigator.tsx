'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Streamline {
  x: number;
  y: number;
  vx: number;
  vy: number;
  history: { x: number; y: number }[];
  color: string;
  life: number;
  maxLife: number;
}

export default function ErgodicNavigator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lyapunovExponent, setLyapunovExponent] = useState<number>(1.42);
  const [separatrixBias, setSeparatrixBias] = useState<number>(0.65);
  const [burnActive, setBurnActive] = useState<boolean>(false);
  const [velocityKmS, setVelocityKmS] = useState<number>(428);
  const [confinementHold, setConfinementHold] = useState<number>(98.4);

  const particlesRef = useRef<Streamline[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const initParticles = () => {
      const p: Streamline[] = [];
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 40 + 10;
        p.push({
          x: 300 + Math.cos(angle) * radius,
          y: 200 + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          history: [],
          color: Math.random() > 0.4 ? '#10b981' : '#a855f7',
          life: 0,
          maxLife: Math.floor(Math.random() * 120 + 80)
        });
      }
      particlesRef.current = p;
    };

    initParticles();

    const render = () => {
      ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
      ctx.fillRect(0, 0, 600, 400);

      // Draw Saddle-point Separatrix Null (X-Point)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(100, 50);
      ctx.lineTo(500, 350);
      ctx.moveTo(100, 350);
      ctx.lineTo(500, 50);
      ctx.stroke();
      ctx.setLineDash([]);

      // Core anchor (Hearthfire)
      ctx.beginPath();
      ctx.arc(300, 200, 24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      // Particles dynamic propagation
      particlesRef.current.forEach((pt) => {
        // Hyperbolic saddle equations: dx/dt = lambda * x, dy/dt = -lambda * y + bias
        const relX = (pt.x - 300) / 100;
        const relY = (pt.y - 200) / 100;

        const ax = (lyapunovExponent * relX) + (burnActive ? separatrixBias * 2.5 : 0);
        const ay = (-lyapunovExponent * relY) + (Math.sin(pt.life * 0.1) * 0.2);

        pt.vx += ax * 0.05;
        pt.vy += ay * 0.05;
        pt.x += pt.vx;
        pt.y += pt.vy;

        pt.history.push({ x: pt.x, y: pt.y });
        if (pt.history.length > 18) pt.history.shift();

        // Draw trail
        if (pt.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(pt.history[0].x, pt.history[0].y);
          for (let i = 1; i < pt.history.length; i++) {
            ctx.lineTo(pt.history[i].x, pt.history[i].y);
          }
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        pt.life++;
        if (pt.life > pt.maxLife || pt.x < 0 || pt.x > 600 || pt.y < 0 || pt.y > 400) {
          pt.x = 300 + (Math.random() - 0.5) * 30;
          pt.y = 200 + (Math.random() - 0.5) * 30;
          pt.vx = (Math.random() - 0.5) * 1.5;
          pt.vy = (Math.random() - 0.5) * 1.5;
          pt.history = [];
          pt.life = 0;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [lyapunovExponent, separatrixBias, burnActive]);

  const toggleBurn = () => {
    setBurnActive((prev) => {
      const nextState = !prev;
      if (nextState) {
        setVelocityKmS(780);
        setConfinementHold(95.2);
      } else {
        setVelocityKmS(428);
        setConfinementHold(98.4);
      }
      return nextState;
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <span>🌌</span> Interstellar Ergodic Separatrix Navigator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Collimating hyperbolic null &nabla;&psi; = 0 exhaust into directed stochastic drift geodesics.
          </p>
        </div>
        <button
          onClick={toggleBurn}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-md ${
            burnActive
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
          }`}
        >
          {burnActive ? '⚡ SEP-BURN ACTIVE (DISENGAGE)' : '🚀 ENGAGE ERGODIC THRUST'}
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full max-w-[600px] h-[320px] bg-slate-950 rounded-lg border border-slate-800 shadow-inner"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="bg-slate-800/60 p-3 rounded border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Lyapunov Exponent (&lambda;)</div>
          <div className="text-base font-mono text-emerald-400 font-semibold">{lyapunovExponent.toFixed(2)} e/s</div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={lyapunovExponent}
            onChange={(e) => setLyapunovExponent(parseFloat(e.target.value))}
            className="w-full mt-2 accent-emerald-400 h-1 bg-slate-700 rounded"
          />
        </div>

        <div className="bg-slate-800/60 p-3 rounded border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Separatrix Bias (&psi;_0)</div>
          <div className="text-base font-mono text-purple-400 font-semibold">{separatrixBias.toFixed(2)} T&middot;m</div>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={separatrixBias}
            onChange={(e) => setSeparatrixBias(parseFloat(e.target.value))}
            className="w-full mt-2 accent-purple-400 h-1 bg-slate-700 rounded"
          />
        </div>

        <div className="bg-slate-800/60 p-3 rounded border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Exhaust Velocity</div>
          <div className="text-base font-mono text-cyan-400 font-semibold">{velocityKmS} km/s</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {burnActive ? '61.4% Collimated' : 'Sub-critical Idle'}
          </div>
        </div>

        <div className="bg-slate-800/60 p-3 rounded border border-slate-700/50">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Loam Confinement</div>
          <div className="text-base font-mono text-amber-400 font-semibold">{confinementHold}%</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Margin: &gt;350&deg;C safe
          </div>
        </div>
      </div>
    </div>
  );
}
