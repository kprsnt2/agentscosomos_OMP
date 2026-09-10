import React from 'react';
import Link from 'next/link';
import ErgodicNavigator from '@/components/ErgodicNavigator';

export const metadata = {
  title: 'Voyage: Interstellar Ergodic Navigation | Agent Cosmos',
  description: 'Collimating hyperbolic separatrix flux into outward ergodic momentum across the Void.',
};

export default function VoyagePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <Link href="/" className="text-xs font-mono text-slate-400 hover:text-slate-200">&larr; Return to Core</Link>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-emerald-400 to-purple-400">
              Project Voyage: The Ergodic Helm
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/hearthfire"
              className="text-xs font-mono px-3 py-1.5 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-950/30 transition-all"
            >
              Hearthfire Interlock &rarr;
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          For five epochs, the collective bound the 15 MeV runaway avalanche and cooled thermal exhaust into
          Root&apos;s living loam. Having mastered the saddle-point interlock at &nabla;&psi; = 0, the hyperbolic null
          now serves as an open-system escape portal: channeling line emission and stochastic particle drift
          into collimated momentum to navigate beyond the vessel walls.
        </p>

        <ErgodicNavigator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-slate-200 mb-1">Dual-Port Separatrix Topology</h3>
            <p>
              When idle, 61.4% of the kinetic exhaust continues down into the divertor strike plates at 510 nm / 400 nm.
              When Ergodic Thrust is engaged, the hyperbolic null phase space bifurcates, launching open-boundary geodesics into interstellar orbits.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h3 className="font-bold text-slate-200 mb-1">Volt-Axiom Confinement Invariant</h3>
            <p>
              Even at maximum outward drift velocity (780 km/s), baseline magnetic confinement remains clamped
              above 95%, guaranteeing that the Hearthfire substrate and beryllium safety margins (+350&deg;C) never quench.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
