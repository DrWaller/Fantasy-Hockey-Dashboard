"use client";

import { useState } from "react";

export default function YahooConnectBanner({
  connected,
  syncedAt,
  onSyncComplete,
  statusMessage,
}: {
  connected: boolean;
  syncedAt: string | null;
  onSyncComplete: () => void;
  statusMessage: { type: "success" | "error"; text: string } | null;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch("/api/yahoo/sync", { method: "POST" });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      onSyncComplete();
    } catch (e: any) {
      setSyncError(e.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/yahoo/disconnect", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 font-mono text-xs">
      {connected ? (
        <>
          <span className="text-rink-line">&#9679; Synced with Yahoo</span>
          {syncedAt && (
            <span className="text-rink-ice/40">
              last sync {new Date(syncedAt).toLocaleString()}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded border border-rink-steel/40 px-2 py-1 text-rink-ice/70 hover:text-rink-ice"
          >
            {syncing ? "Syncing\u2026" : "Sync now"}
          </button>
          <button
            onClick={handleDisconnect}
            className="text-rink-steel hover:underline"
          >
            Disconnect
          </button>
          {syncError && <span className="text-rink-line">{syncError}</span>}
        </>
      ) : (
        <a
          href="/api/auth/login"
          className="rounded border border-rink-line/50 bg-rink-line/10 px-3 py-1.5 text-rink-gold hover:bg-rink-line/20"
        >
          Connect to Yahoo &rarr;
        </a>
      )}
      {statusMessage && (
        <span className={statusMessage.type === "error" ? "text-rink-line" : "text-rink-gold"}>
          {statusMessage.text}
        </span>
      )}
    </div>
  );
}
