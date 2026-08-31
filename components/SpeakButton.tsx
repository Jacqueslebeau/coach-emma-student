"use client";

// 🔊 Emma lit ce texte à voix haute (questions, feedbacks…). raw=true : le
// texte peut contenir du LaTeX — il est d'abord converti en script oral.
// L'élément Audio est DÉBLOQUÉ dans le clic (silence joué avant le fetch),
// sinon le navigateur refuse le play() qui arrive après l'await.
import { useEffect, useRef, useState } from "react";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

export default function SpeakButton({ text, raw = true, title = "Emma reads it aloud" }: {
  text: string; raw?: boolean; title?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.onended = () => setState("idle");
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (state === "playing") { a.pause(); setState("idle"); return; }
    if (urlRef.current) {
      a.src = urlRef.current;
      a.currentTime = 0;
      setState("playing");
      a.play().catch(() => setState("idle"));
      return;
    }
    // Déblocage synchrone dans le clic, avant l'await.
    a.src = SILENT_WAV;
    a.play().catch(() => {});
    setState("loading");
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 3000), raw }),
      });
      if (!r.ok) throw new Error();
      const url = URL.createObjectURL(await r.blob());
      urlRef.current = url;
      a.src = url;
      setState("playing");
      await a.play().catch(() => setState("idle"));
    } catch {
      setState("idle");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={title}
      className="text-indigo hover:text-indigo-deep text-sm font-semibold shrink-0 disabled:opacity-50"
      disabled={state === "loading"}
    >
      {state === "loading" ? "…" : state === "playing" ? "❚❚" : "🔊"}
    </button>
  );
}
