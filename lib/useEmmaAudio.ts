"use client";

// LA voix d'Emma côté client — un seul élément Audio, DÉBLOQUÉ dans le clic.
// Règle d'or : les navigateurs refusent un .play() lancé plusieurs secondes
// après le geste utilisateur (le temps du fetch). On joue donc un silence
// DANS le clic (unlock), puis le même élément peut jouer le vrai son plus tard.
import { useCallback, useEffect, useRef, useState } from "react";

// WAV silencieux minimal (44 octets d'en-tête + 1 échantillon).
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

export function useEmmaAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");

  useEffect(() => {
    const a = new Audio();
    a.onended = () => setState("idle");
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // À appeler SYNCHRONE dans le handler de clic/submit, avant tout await.
  const unlock = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.src = SILENT_WAV;
    a.play().catch(() => {});
  }, []);

  // Fait parler Emma : text → TTS → lecture (élément déjà débloqué).
  const speak = useCallback(async (text: string, raw = false) => {
    const a = audioRef.current;
    if (!a) return;
    setState("loading");
    try {
      const clean = raw
        ? text
        : text.replace(/\*\*|__|\*|#+\s?/g, "").replace(/\\\(|\\\)|\\\[|\\\]/g, " ");
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: clean.slice(0, 4500), raw }),
      });
      if (!r.ok) { setState("idle"); return; }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(await r.blob());
      urlRef.current = url;
      a.src = url;
      setState("playing");
      await a.play().catch(() => setState("idle"));
    } catch {
      setState("idle");
    }
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); setState("paused"); }, []);
  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setState("playing")).catch(() => {});
  }, []);
  const stop = useCallback(() => { audioRef.current?.pause(); setState("idle"); }, []);

  return { unlock, speak, pause, resume, stop, state, audioRef };
}
