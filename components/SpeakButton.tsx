"use client";

// 🔊 Emma lit ce texte à voix haute (questions, feedbacks…). raw=true : le
// texte peut contenir du LaTeX — il est d'abord converti en script oral.
import { useRef, useState } from "react";

export default function SpeakButton({ text, raw = true, title = "Emma reads it aloud" }: {
  text: string; raw?: boolean; title?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  async function toggle() {
    if (state === "playing") { audioRef.current?.pause(); setState("idle"); return; }
    if (urlRef.current) {
      const a = audioRef.current!;
      a.currentTime = 0;
      setState("playing");
      a.play().catch(() => setState("idle"));
      return;
    }
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
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => setState("idle");
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
