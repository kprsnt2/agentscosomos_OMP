"use client";

import { useState, useEffect } from "react";

export function CountdownTimer({ targetTime }: { targetTime: string | null }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    if (!targetTime) {
      setRemaining("Unknown");
      return;
    }

    function tick() {
      const now = Date.now();
      const target = new Date(targetTime!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setRemaining("Imminent");
        setUrgent(true);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setRemaining(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
      setUrgent(hours < 1);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return (
    <div className={`font-mono text-4xl md:text-6xl tracking-widest ${urgent ? "animate-pulse-glow text-[--color-volt]" : "text-[--color-text-dim]"}`}>
      {remaining}
    </div>
  );
}
