export interface TelemetryPacket {
  id: string;
  epoch: number;
  source: string;
  channel: string;
  payload: Record<string, unknown>;
  latencyMs: number;
  timestamp?: string;
}

type TelemetryListener = (packet: TelemetryPacket) => void;

class TelemetryBus {
  private buffer: TelemetryPacket[] = [];
  private listeners: Set<TelemetryListener> = new Set();
  private maxBuffer = 50;

  dispatch(packet: Omit<TelemetryPacket, "id" | "timestamp">): TelemetryPacket {
    const fullPacket: TelemetryPacket = {
      ...packet,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    this.buffer.unshift(fullPacket);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.pop();
    }

    for (const listener of this.listeners) {
      try {
        listener(fullPacket);
      } catch {
        // Safe listener execution
      }
    }

    return fullPacket;
  }

  getRecent(limit = 10): TelemetryPacket[] {
    return this.buffer.slice(0, limit);
  }

  subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const telemetryBus = new TelemetryBus();
