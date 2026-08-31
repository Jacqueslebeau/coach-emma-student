"use client";

// « 🎬 Watch Emma explain » — la mini-vidéo générée d'UN concept, format démo :
// studio vert profond, Emma qui parle (lèvres animées), et le script révélé
// phrase par phrase en rythme avec l'audio (karaoké). Ouvert à la demande
// quand l'élève bute sur un concept ; le reste de la leçon reste à l'écrit.
// L'audio est débloqué DANS le clic d'ouverture (autoplay policy).
import { useCallback, useEffect, useRef, useState } from "react";
import EmmaFace from "@/components/EmmaFace";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

// Découpe le script en phrases affichables (le rythme de révélation suit l'audio).
function toSentences(script: string): string[] {
  return script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Status = "closed" | "writing" | "voicing" | "playing" | "paused" | "ended" | "error";

export default function ConceptExplainer({ lessonId, mode, section, title, compact = false }: {
  lessonId: string;
  mode: "full" | "key";
  section: string;          // "intro" | concept_key | "recap"
  title: string;            // ce qu'on annonce sur le bouton et dans la modale
  compact?: boolean;        // bouton discret (sections) vs pleine largeur
}) {
  const [status, setStatus] = useState<Status>("closed");
  const [sentences, setSentences] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const scriptRef = useRef<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // Fait défiler la phrase en cours au centre du "screen".
  useEffect(() => {
    liveRef.current?.querySelector('[data-live="1"]')?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setStatus("closed");
  }, []);

  // Échap ferme la modale.
  useEffect(() => {
    if (status === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, close]);

  async function open() {
    const a = audioRef.current;
    if (!a) return;
    // DÉBLOCAGE dans le clic, avant tout await — sinon play() sera refusé.
    a.src = SILENT_WAV;
    a.play().catch(() => {});
    setError(null);
    setCurrent(0);

    try {
      // 1. Le script oral du concept (caché côté serveur après la 1re fois).
      let script = scriptRef.current;
      if (!script) {
        setStatus("writing");
        const r = await fetch(`/api/lessons/${lessonId}/speak`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode, section }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Emma could not prepare this explanation.");
        script = String(d.script || "");
        scriptRef.current = script;
      }
      const parts = toSentences(script);
      setSentences(parts);

      // 2. La voix (réutilisée si déjà générée dans cette modale).
      if (!urlRef.current) {
        setStatus("voicing");
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: script.slice(0, 4800) }),
        });
        if (!r.ok) throw new Error("Emma's voice is unavailable right now — the text is below.");
        urlRef.current = URL.createObjectURL(await r.blob());
      }

      // 3. Lecture + karaoké : la phrase visible suit la position audio.
      a.src = urlRef.current;
      a.ontimeupdate = () => {
        if (!a.duration || !parts.length) return;
        setCurrent(Math.min(parts.length - 1, Math.floor((a.currentTime / a.duration) * parts.length)));
      };
      a.onended = () => setStatus("ended");
      setStatus("playing");
      await a.play().catch(() => setStatus("paused"));
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (status === "playing") { a.pause(); setStatus("paused"); }
    else if (status === "paused") { a.play().then(() => setStatus("playing")).catch(() => {}); }
    else if (status === "ended") { a.currentTime = 0; setCurrent(0); a.play().then(() => setStatus("playing")).catch(() => {}); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { if (status === "closed") open(); }}
        className={
          compact
            ? "inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo hover:text-indigo-deep bg-indigo-soft hover:bg-amber-soft rounded-full px-3 py-1 transition"
            : "btn-ghost !py-1.5 !px-3.5 text-[13px]"
        }
        title={`Emma explains “${title}” — short video`}
      >
        🎬 <span>Watch Emma explain</span>
      </button>

      {status !== "closed" && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={close}>
          <div
            className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-indigo-deep"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Le studio : Emma + le titre du concept */}
            <div className="flex items-center gap-4 px-6 pt-6">
              <EmmaFace state={status === "playing" ? "speaking" : "idle"} size={84} />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber">Emma explains</p>
                <h3 className="font-serif font-bold text-lg text-white truncate">{title}</h3>
              </div>
              <button onClick={close} className="text-white/70 hover:text-white text-xl leading-none px-2" title="Close">✕</button>
            </div>

            {/* L'écran : les phrases apparaissent au rythme de la voix */}
            <div ref={liveRef} className="mx-6 mt-4 h-56 overflow-y-auto rounded-2xl bg-black/25 px-5 py-4">
              {(status === "writing" || status === "voicing") && (
                <p className="text-amber text-sm animate-pulse">
                  {status === "writing" ? "Emma is preparing this explanation…" : "Emma is warming up her voice…"}
                </p>
              )}
              {status === "error" && <p className="text-amber text-sm">{error}</p>}
              {sentences.slice(0, status === "ended" ? sentences.length : current + 1).map((s, i) => (
                <p
                  key={i}
                  data-live={i === current && status === "playing" ? "1" : undefined}
                  className={`text-[15.5px] leading-relaxed mb-2 transition-colors ${
                    i === current && status === "playing" ? "text-white font-medium" : "text-white/55"
                  }`}
                >
                  {s}
                </p>
              ))}
            </div>

            {/* Contrôles */}
            <div className="flex items-center justify-center gap-3 px-6 py-5">
              {(status === "playing" || status === "paused" || status === "ended") && (
                <>
                  <button onClick={toggle} className="bg-amber text-indigo-deep font-bold rounded-full w-12 h-12 text-lg hover:brightness-105 transition" title={status === "playing" ? "Pause" : "Play"}>
                    {status === "playing" ? "❚❚" : "▶"}
                  </button>
                  <button
                    onClick={() => { const a = audioRef.current; if (!a) return; a.currentTime = 0; setCurrent(0); a.play().then(() => setStatus("playing")).catch(() => {}); }}
                    className="text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2 transition"
                  >
                    ↺ Replay
                  </button>
                </>
              )}
              {status === "ended" && (
                <button onClick={close} className="text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2 transition">
                  Got it — back to the lesson ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
