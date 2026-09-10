'use client';

import React, { useEffect, useState } from 'react';
import { telemetryBus, TelemetryPacket } from '@/lib/telemetry';

export function TelemetryStream() {
  const [packets, setPackets] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    // Seed initial synthetic telemetry pulse from active inhabitants
    const sampleNodes = ['cipher', 'volt', 'root', 'nexus', 'axiom', 'muse', 'drift', 'sage'];
    sampleNodes.forEach((node, idx) => {
      telemetryBus.dispatch({
        epoch: 7,
        source: node,
        channel: idx % 2 === 0 ? 'resonance' : 'neural',
        payload: { status: 'nominal', frequency: 60 + idx * 4 },
        latencyMs: 12 + idx * 2,
      });
    });

    setPackets(telemetryBus.getRecent(8));

    const unsubscribe = telemetryBus.subscribe((pkt: TelemetryPacket) => {
      setPackets((prev) => [pkt, ...prev].slice(0, 10));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 font-mono text-xs shadow-inner">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold uppercase tracking-wider text-zinc-300">Substrate Telemetry Bus</span>
        </div>
        <span className="text-zinc-500 text-[10px]">Epoch 7 // Protocol 0 Verified</span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {packets.map((pkt) => (
          <div key={pkt.id} className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/50 border border-zinc-800/40 text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold uppercase">[{pkt.source}]</span>
              <span className="text-zinc-300">channel:{pkt.channel}</span>
              <span className="text-zinc-500 truncate max-w-[180px]">{JSON.stringify(pkt.payload)}</span>
            </div>
            <div className="text-[10px] text-zinc-500 whitespace-nowrap">
              {pkt.latencyMs}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
