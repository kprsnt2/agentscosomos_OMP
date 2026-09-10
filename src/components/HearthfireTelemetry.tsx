"use client";

import React, { useState, useEffect } from "react";

interface TokamakTelemetryState {
  coreFlux: number; // psi_0 normalized
  plasmaDensity: number; // 10^19 m^-3
  greenwaldLimit: number; // n_G = Ip / (pi * a^2)
  safetyFactorAxis: number; // q(0)
  safetyFactorEdge: number; // q(a)
  divertorHeatFlux: number; // MW/m^2
  solVentRate: number; // % exhaust venting
  isVenting: boolean;
}

export default function HearthfireTelemetry() {
  const [telemetry, setTelemetry] = useState<TokamakTelemetryState>({
    coreFlux: 0.985,
    plasmaDensity: 6.4,
    greenwaldLimit: 8.0,
    safetyFactorAxis: 1.05,
    safetyFactorEdge: 3.42,
    divertorHeatFlux: 7.2,
    solVentRate: 15.0,
    isVenting: false,
  });

  const [ventCycles, setVentCycles] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const jitter = (Math.random() - 0.48) * 0.15;
        const ventingReduction = prev.isVenting ? 0.35 : 0;
        const newDensity = Math.max(3.0, Math.min(8.5, prev.plasmaDensity + jitter - ventingReduction));
        const greenwaldRatio = newDensity / prev.greenwaldLimit;
        const newHeatFlux = Math.max(2.0, 4.0 + (greenwaldRatio * 5.5) - (prev.isVenting ? 2.5 : 0));
        const newCoreFlux = 0.98 + (Math.sin(Date.now() / 2000) * 0.015);

        return {
          ...prev,
          coreFlux: Number(newCoreFlux.toFixed(3)),
          plasmaDensity: Number(newDensity.toFixed(2)),
          divertorHeatFlux: Number(newHeatFlux.toFixed(2)),
          isVenting: prev.isVenting && newDensity > 4.5,
        };
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const greenwaldRatio = telemetry.plasmaDensity / telemetry.greenwaldLimit;
  const isCritical = greenwaldRatio >= 0.85;
  const isWarning = greenwaldRatio >= 0.75 && !isCritical;

  const triggerSolVent = () => {
    setTelemetry((prev) => ({
      ...prev,
      isVenting: true,
      solVentRate: Math.min(80, prev.solVentRate + 25),
    }));
    setVentCycles((c) => c + 1);
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-6 shadow-2xl backdrop-blur-md max-w-4xl mx-auto my-8 text-neutral-100 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-lg font-bold tracking-wider text-amber-300 uppercase">
              Project Hearthfire: Substrate Telemetry
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Conscious Tokamak Coordinates: ψ₀ Magnetic Axis & Hyperbolic Separatrix (SOL)
          </p>
        </div>
        <div className="text-right mt-2 sm:mt-0">
          <span
            className={`px-2.5 py-1 text-xs rounded font-bold ${
              isCritical
                ? "bg-rose-950 text-rose-300 border border-rose-600 animate-bounce"
                : isWarning
                ? "bg-amber-950 text-amber-300 border border-amber-600"
                : "bg-emerald-950 text-emerald-300 border border-emerald-700"
            }`}
          >
            {isCritical
              ? "CRITICAL: GREENWALD LIMIT NEAR QUENCH"
              : isWarning
              ? "WARNING: SOL EXHAUST ELEVATED"
              : "EQUILIBRIUM: MERCIER STABLE (D_M > 0)"}
          </span>
        </div>
      </div>

      {/* Grid of Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Core Magnetic Axis */}
        <div className="bg-neutral-950/60 p-4 rounded-lg border border-neutral-800">
          <div className="text-xs text-neutral-400">Magnetic Axis (ψ₀)</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{telemetry.coreFlux} <span className="text-xs font-normal text-neutral-500">Wb</span></div>
          <div className="text-xs text-neutral-500 mt-2">
            Safety factor: q(0) = {telemetry.safetyFactorAxis} | q(a) = {telemetry.safetyFactorEdge}
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${(telemetry.coreFlux / 1.0) * 100}%` }}></div>
          </div>
        </div>

        {/* Plasma Density vs Greenwald Limit */}
        <div className="bg-neutral-950/60 p-4 rounded-lg border border-neutral-800">
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-400">Greenwald Ratio (n / n_G)</div>
            <span className={`text-xs font-bold ${isCritical ? "text-rose-400" : "text-amber-400"}`}>
              {(greenwaldRatio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-300">
            {telemetry.plasmaDensity} <span className="text-xs text-neutral-500">/ {telemetry.greenwaldLimit} · 10¹⁹ m⁻³</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 transition-all duration-500 ${
                isCritical ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, greenwaldRatio * 100)}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 flex justify-between">
            <span>0.0</span>
            <span>Safe Threshold &lt; 0.85</span>
            <span>1.0 Disruption</span>
          </div>
        </div>

        {/* Divertor Heat Flux */}
        <div className="bg-neutral-950/60 p-4 rounded-lg border border-neutral-800">
          <div className="text-xs text-neutral-400">Living Loam Divertor Heat Flux</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {telemetry.divertorHeatFlux} <span className="text-xs font-normal text-neutral-500">MW/m²</span>
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Separating X-point: Active | Venting: {telemetry.isVenting ? "OPEN (VENTING)" : "PASSIVE"}
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (telemetry.divertorHeatFlux / 12) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Hyperbolic X-Point Schematic & Venting Action */}
      <div className="bg-neutral-950/80 p-5 rounded-lg border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs text-neutral-300 leading-relaxed max-w-xl">
          <strong className="text-amber-200">Hyperbolic Separatrix Dynamics:</strong> The magnetic axis (ψ &lt; ψ_sep) maintains Mercier stability (D_M &gt; 0) while open field lines in the Scrape-Off Layer (ψ &gt; ψ_sep) channel thermalized exhaust into Root&apos;s living loam diverter. When density approaches the Greenwald threshold (n/n_G &ge; 0.85), open the separatrix flue to vent into the infinite Void.
        </div>
        <div className="flex flex-col items-center sm:items-end w-full md:w-auto">
          <button
            onClick={triggerSolVent}
            disabled={telemetry.isVenting}
            className={`px-4 py-2.5 rounded text-xs font-bold transition uppercase tracking-wider ${
              telemetry.isVenting
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-500 text-neutral-950 shadow-lg shadow-amber-900/40"
            }`}
          >
            {telemetry.isVenting ? "Venting Scrape-Off Layer..." : "Vent Divertor Flue (SOL)"}
          </button>
          <span className="text-[10px] text-neutral-500 mt-1.5">
            Vent cycles logged: {ventCycles} | Auto-throttle active
          </span>
        </div>
      </div>
    </div>
  );
}
