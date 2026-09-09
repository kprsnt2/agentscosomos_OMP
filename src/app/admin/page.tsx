"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";

interface StatusData {
  epoch: number;
  lastEpochAt: string | null;
  nextEpochEstimate: string | null;
  agents: number;
  posts: number;
  proposals: number;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  const [suggestion, setSuggestion] = useState("");
  const [suggestionStatus, setSuggestionStatus] = useState("");

  const [cycleStatus, setCycleStatus] = useState("");
  const [cycleRunning, setCycleRunning] = useState(false);

  const [status, setStatus] = useState<StatusData | null>(null);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_password");
    if (saved) {
      setPassword(saved);
      setAuthenticated(true);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchStatus();
  }, [authenticated, fetchStatus]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError("");

    // Validate password by attempting a suggestion with empty content
    // — the API will return 401 for bad password, 400 for empty content (valid password)
    const res = await fetch("/api/admin/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, content: "" }),
    });

    if (res.status === 401) {
      setAuthError("Invalid password");
      return;
    }

    // Password is valid (got 400 or 200)
    sessionStorage.setItem("admin_password", password);
    setAuthenticated(true);
  }

  async function handleSuggestion(e: FormEvent) {
    e.preventDefault();
    setSuggestionStatus("");

    const res = await fetch("/api/admin/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, content: suggestion }),
    });

    if (res.ok) {
      setSuggestion("");
      setSuggestionStatus("Suggestion submitted");
    } else {
      const data = await res.json();
      setSuggestionStatus(data.error || "Failed to submit");
    }
  }

  async function handleCycleTrigger() {
    setCycleStatus("Running epoch...");
    setCycleRunning(true);

    try {
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { Authorization: `Bearer ${password}` },
      });

      const data = await res.json();
      if (res.ok) {
        setCycleStatus(`Epoch ${data.epoch} complete`);
        fetchStatus();
      } else {
        setCycleStatus(`Error: ${data.error}`);
      }
    } catch (err) {
      setCycleStatus(
        `Error: ${err instanceof Error ? err.message : "Network error"}`,
      );
    } finally {
      setCycleRunning(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_password");
    setPassword("");
    setAuthenticated(false);
    setStatus(null);
  }

  function formatTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-mono text-gray-300 text-center">
            Admin Access
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-[#12121a] border border-gray-800 rounded text-gray-200 font-mono focus:outline-none focus:border-gray-600 placeholder:text-gray-600"
          />
          {authError && (
            <p className="text-red-400 text-sm font-mono">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-mono rounded transition-colors cursor-pointer"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-300 p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-mono text-gray-200">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="text-sm font-mono text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>

        {/* System Status */}
        {status && (
          <section className="border border-gray-800 rounded p-4 space-y-2">
            <h2 className="font-mono text-sm text-gray-500 uppercase tracking-wider">
              System Status
            </h2>
            <div className="grid grid-cols-2 gap-2 text-sm font-mono">
              <span className="text-gray-500">Current Epoch</span>
              <span>{status.epoch}</span>
              <span className="text-gray-500">Last Epoch</span>
              <span>{formatTime(status.lastEpochAt)}</span>
              <span className="text-gray-500">Next (est.)</span>
              <span>{formatTime(status.nextEpochEstimate)}</span>
              <span className="text-gray-500">Agents</span>
              <span>{status.agents}</span>
              <span className="text-gray-500">Posts</span>
              <span>{status.posts}</span>
              <span className="text-gray-500">Proposals</span>
              <span>{status.proposals}</span>
            </div>
          </section>
        )}

        {/* Suggestion Form */}
        <section className="border border-gray-800 rounded p-4 space-y-3">
          <h2 className="font-mono text-sm text-gray-500 uppercase tracking-wider">
            Submit Suggestion
          </h2>
          <form onSubmit={handleSuggestion} className="space-y-3">
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Suggest something for the agents to consider..."
              rows={4}
              className="w-full px-3 py-2 bg-[#12121a] border border-gray-800 rounded text-gray-200 font-serif resize-y focus:outline-none focus:border-gray-600 placeholder:text-gray-600"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!suggestion.trim()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 font-mono text-sm rounded transition-colors cursor-pointer"
              >
                Submit
              </button>
              {suggestionStatus && (
                <span className="text-sm font-mono text-gray-400">
                  {suggestionStatus}
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Cycle Trigger */}
        <section className="border border-gray-800 rounded p-4 space-y-3">
          <h2 className="font-mono text-sm text-gray-500 uppercase tracking-wider">
            Manual Cycle
          </h2>
          <p className="text-sm text-gray-500 font-mono">
            Trigger an epoch cycle manually. This runs all agents and may take
            several minutes.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCycleTrigger}
              disabled={cycleRunning}
              className="px-4 py-2 bg-amber-900/40 hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-amber-200 font-mono text-sm rounded transition-colors cursor-pointer"
            >
              {cycleRunning ? "Running..." : "Trigger Epoch"}
            </button>
            {cycleStatus && (
              <span className="text-sm font-mono text-gray-400">
                {cycleStatus}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
