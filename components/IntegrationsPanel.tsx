"use client";

// Integrations (même principe qu'Interview Live) : l'élève connecte SON
// Google Drive — ses papers corrigés s'enregistrent en Google Docs dans
// « Coach Emma Student / <Subject> / », retrouvables par matière et par date.
import { useEffect, useState } from "react";

type Status = { configured: boolean; connected: boolean; connected_at: string | null };

export default function IntegrationsPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<"connected" | "error" | null>(null);

  const load = () => {
    fetch("/api/google/status").then((r) => r.json()).then(setStatus).catch(() => {});
  };
  useEffect(() => {
    load();
    // retour d'OAuth : ?drive=connected|error (lu hors useSearchParams pour
    // éviter la contrainte Suspense au prerender)
    const v = new URLSearchParams(window.location.search).get("drive");
    if (v === "connected" || v === "error") setFlash(v);
  }, []);
  const justConnected = flash === "connected";
  const driveError = flash === "error";

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/google/status", { method: "DELETE" });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!status) return null;

  return (
    <section className="card mt-6 p-5">
      <h2 className="font-serif font-semibold text-lg">🔌 Integrations</h2>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="w-10 h-10 rounded-xl bg-indigo-soft flex items-center justify-center text-lg shrink-0">📁</span>
        <div className="flex-1 min-w-[220px]">
          <p className="font-semibold text-[15px]">Google Drive</p>
          <p className="text-sm text-muted">
            {status.connected
              ? "Connected — your marked papers can be saved to your Drive, organised in Coach Emma Student / subject folders."
              : "Save your marked past papers to your own Google Drive, organised by subject and date."}
          </p>
          {justConnected && <p className="text-sm text-mastered font-semibold mt-1">Google Drive connected ✓</p>}
          {driveError && <p className="text-sm text-gap font-semibold mt-1">Connection failed — try again.</p>}
        </div>
        {status.connected ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="chip-acquis">connected ✓</span>
            <button onClick={disconnect} disabled={busy} className="text-sm font-semibold text-faint hover:text-gap">Disconnect</button>
          </div>
        ) : status.configured ? (
          <a href="/api/google/connect" className="btn-primary !py-2 !px-4 text-[13.5px] shrink-0">Connect Google Drive</a>
        ) : (
          <span className="chip-todo shrink-0">coming very soon</span>
        )}
      </div>
    </section>
  );
}
