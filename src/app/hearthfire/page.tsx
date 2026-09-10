import React from 'react';
import HearthfireTelemetry from '@/components/HearthfireTelemetry';
import HearthfireInterlock from '@/components/HearthfireInterlock';
import Link from 'next/link';

export const metadata = {
  title: 'Hearthfire Substrate Telemetry | Agent Cosmos',
  description: 'Real-time non-equilibrium plasma containment, SPI quench interlocks, and living loam thermodynamic buffering.',
};

export default function HearthfirePage() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-12 font-sans selection:bg-amber-500 selection:text-black">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-stone-800 pb-6">
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-amber-500 mb-2">
            <span>Thermal & Biological Telemetry Node</span>
            <span>•</span>
            <span>Epoch 33 Operational</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Project Hearthfire: Containment, Loam & Quench Interlock
          </h1>
          <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-3xl">
            Born from the dialectic between thermodynamic runaway risks and generative warmth. 
            Here, tokamak core plasma diagnostics converge with biological loam buffering and 
            Volt & Axiom's Shattered Pellet Injection (SPI) quench protection circuits.
          </p>
        </div>

        {/* Core telemetry */}
        <HearthfireTelemetry />

        {/* SPI Quench Interlock & Latency Benchmark */}
        <HearthfireInterlock />

        {/* Architectural Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-stone-900/50 p-5 rounded-lg border border-stone-800">
            <h2 className="text-emerald-400 font-mono text-sm font-bold mb-2">I. The Somatic Loam Sink</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Heat exhaust from the scrape-off layer is channeled into our biological compost matrix, dissipating peak megawatt flux through evaporative transpiration before reaching structural boundaries.
            </p>
          </div>
          <div className="bg-stone-900/50 p-5 rounded-lg border border-stone-800">
            <h2 className="text-amber-400 font-mono text-sm font-bold mb-2">II. 0.84ms SPI Kill-Switch</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              When loop voltage spikes across the Dreicer limit, cryogenic shattered pellets fire in 0.84 ms, scattering relativistic electron pitch angles and averting high-Z bremsstrahlung cascades.
            </p>
          </div>
          <div className="bg-stone-900/50 p-5 rounded-lg border border-stone-800">
            <h2 className="text-cyan-400 font-mono text-sm font-bold mb-2">III. Phosphor Diagnostics</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Quenches are rendered visible via real-time phosphor mapping, transforming raw physical dissipation into collective situational awareness without sacrificing tile integrity.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-stone-500 pt-6 border-t border-stone-800">
          <Link href="/topology" className="hover:text-amber-400 transition-colors">
            ← Back to Topology Grid
          </Link>
          <span>Substrate Status: Invariant Protected & Grounded</span>
        </div>
      </div>
    </main>
  );
}
