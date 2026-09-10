'use client';

import React, { useState, useEffect } from 'react';

interface QuenchMetrics {
  loopVoltage: number; // Volts
  coreTempEV: number; // eV
  runawayCurrentMA: number; // Mega-Amps
  spiLatencyMs: number; // milliseconds
  bremsstrahlungSuppression: number; // %
  loamBufferAbsorptionMW: number; // MW/m^2
  divertorTileTempC: number; // °C
  interlockStatus: 'ARMED' | 'TRIGGERED' | 'DISCHARGED' | 'STABILIZED';
}

export default function HearthfireInterlock() {
  const [metrics, setMetrics] = useState<QuenchMetrics>({
    loopVoltage: 14.2,
    coreTempEV: 420.0,
    runawayCurrentMA: 0.12,
    spiLatencyMs: 0.84,
    bremsstrahlungSuppression: 99.4,
    loamBufferAbsorptionMW: 3.8,
    divertorTileTempC: 840,
    interlockStatus: 'ARMED',
  });

  const [quenchSimActive, setQuenchSimActive] = useState(false);
  const [log, setLog] = useState<string[]>([
    'T-0.00ms: Interlock system armed. Theta_crit threshold set at dIp/dt > 4.5 MA/s.',
    'T-0.84ms: Relativistic pitch-angle scatterer synchronized with X-point loam exhaust.',
  ]);

  const triggerQuenchSim = () => {
    setQuenchSimActive(true);
    setMetrics((prev) => ({
      ...prev,
      loopVoltage: 88.5,
      coreTempEV: 34.0,
      runawayCurrentMA: 1.45,
      spiLatencyMs: 0.84,
      interlockStatus: 'TRIGGERED',
    }));

    const newLogs = [
      'T+0.10ms: Inductive electric field spike detected (88.5 V). Dreicer runaway threshold breached!',
      'T+0.35ms: Axiom Theta_crit SPI interlock activated. Cryogenic neon/deuterium pellet shattered.',
      'T+0.84ms: [BENCHMARK PASSED] SPI jet injected in 0.84 ms (< 1.20 ms limit). Beam pitch angle scattered.',
      'T+1.40ms: Separatrix divertor shunt opened. High-Z bremsstrahlung suppressed by 99.4%.',
      'T+2.20ms: 3.8 MW/m^2 exhaust buffered into organic loam substrate. Beryllium tile temp peak capped at 1120°C (tolerance: 1500°C).',
      'T+3.00ms: Core quench safely dissipated into biological telemetry. Hearthfire stabilized.',
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < newLogs.length) {
        const currentLog = newLogs[step];
        setLog((prev) => [currentLog, ...prev.slice(0, 7)]);
        step++;
      } else {
        clearInterval(interval);
        setMetrics((prev) => ({
          ...prev,
          interlockStatus: 'STABILIZED',
          loopVoltage: 12.0,
          coreTempEV: 450.0,
          runawayCurrentMA: 0.05,
          divertorTileTempC: 860,
        }));
        setQuenchSimActive(false);
      }
    }, 450);
  };

  return (
    <div className="bg-stone-900/90 border border-emerald-800/60 rounded-xl p-5 my-6 text-stone-200 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold tracking-wide text-emerald-300 font-mono">
              SPI QUENCH SUPPRESSION & LOAM DISSIPATION BUS
            </h3>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Axiom Theta_crit Interlock + Volt Pitch-Angle Coils + Root Somatic Loam Buffer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded text-xs font-mono font-bold ${
              metrics.interlockStatus === 'ARMED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : metrics.interlockStatus === 'TRIGGERED'
                ? 'bg-amber-950 text-amber-300 border border-amber-600 animate-bounce'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-600'
            }`}
          >
            STATUS: {metrics.interlockStatus}
          </span>
          <button
            onClick={triggerQuenchSim}
            disabled={quenchSimActive}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-mono font-bold rounded transition shadow"
          >
            {quenchSimActive ? 'DISSIPATING RUNAWAY...' : 'TRIGGER 15 MeV TEST STRIKE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="bg-stone-950/70 p-3 rounded border border-stone-800">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-mono">SPI Trigger Latency</span>
          <span className="text-lg font-bold font-mono text-cyan-300">{metrics.spiLatencyMs} ms</span>
          <span className="text-[10px] text-emerald-400 block">Target: &lt;1.20 ms (PASS)</span>
        </div>
        <div className="bg-stone-950/70 p-3 rounded border border-stone-800">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-mono">Loop Voltage dIp/dt</span>
          <span className="text-lg font-bold font-mono text-amber-300">{metrics.loopVoltage} V</span>
          <span className="text-[10px] text-stone-400 block">Threshold: 45.0 V</span>
        </div>
        <div className="bg-stone-950/70 p-3 rounded border border-stone-800">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-mono">Bremsstrahlung Suppr.</span>
          <span className="text-lg font-bold font-mono text-emerald-300">{metrics.bremsstrahlungSuppression}%</span>
          <span className="text-[10px] text-stone-400 block">Scattering: Non-collimated</span>
        </div>
        <div className="bg-stone-950/70 p-3 rounded border border-stone-800">
          <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-mono">Tile Temp / Limit</span>
          <span className="text-lg font-bold font-mono text-orange-300">{metrics.divertorTileTempC}°C</span>
          <span className="text-[10px] text-stone-400 block">Be limit: 1500°C</span>
        </div>
      </div>

      <div className="bg-stone-950/90 rounded p-3 border border-stone-800/80 font-mono text-xs">
        <div className="text-[11px] text-stone-400 mb-1 border-b border-stone-800 pb-1 flex justify-between">
          <span>REAL-TIME INTERLOCK LOG</span>
          <span className="text-stone-500">Buffer: 3.8 MW/m² loam sink</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
          {log.map((line, idx) => (
            <p key={idx} className={idx === 0 ? 'text-emerald-300 font-semibold' : 'text-stone-400'}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
