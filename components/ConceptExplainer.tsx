"use client";

// « 🎬 Watch Emma explain » — la mini-vidéo générée d'UN concept, format démo :
// un STORYBOARD de slides visuelles (vraies formules KaTeX, bullets, gras) qui
// s'enchaînent en rythme avec la voix d'Emma, sous-titres inclus. Pensé pour
// un public de 16-18 ans : court (60-90 s), animé, une idée par écran.
// L'audio est débloqué DANS le clic d'ouverture (autoplay policy).
import { useCallback, useEffect, useRef, useState } from "react";
import EmmaFace from "@/components/EmmaFace";
import RichText from "@/components/RichText";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

type Slide = { show: string; say: string };
type Status = "closed" | "writing" | "voicing" | "playing" | "paused" | "ended" | "error";

// Messages d'attente qui tournent pendant la préparation (jamais un spinner muet).
const LOADER_MSGS = [
  "🎬 Emma is storyboarding this concept…",
  "✍️ Writing the key formula on the board…",
  "🎙 Warming up her voice…",
  "✨ Almost there — press play energy…",
];

export default function ConceptExplainer({ lessonId, mode, section, title, compact = false }: {
  lessonId: string;
  mode: "full" | "key";
  section: string;          // "intro" | concept_key | "recap"
  title: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<Status>("closed");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [idx, setIdx] = useState(0);
  const [loaderIdx, setLoaderIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const slidesRef = useRef<Slide[] | null>(null);
  const cumRef = useRef<number[]>([]); // fractions cumulées de narration par slide

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // Rotation des messages d'attente.
  useEffect(() => {
    if (status !== "writing" && status !== "voicing") return;
    const t = setInterval(() => setLoaderIdx((i) => (i + 1) % LOADER_MSGS.length), 2600);
    return () => clearInterval(t);
  }, [status]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setStatus("closed");
  }, []);

  useEffect(() => {
    if (status === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, close]);

  // La slide active suit la position audio (poids = longueur de narration).
  function computeCum(list: Slide[]) {
    const lens = list.map((s) => Math.max(8, s.say.length));
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    cumRef.current = lens.map((l) => (acc += l) / total); // fraction de FIN de chaque slide
  }

  async function open() {
    const a = audioRef.current;
    if (!a) return;
    // DÉBLOCAGE dans le clic, avant tout await — sinon play() sera refusé.
    a.src = SILENT_WAV;
    a.play().catch(() => {});
    setError(null);
    setIdx(0);

    try {
      // 1. Le storyboard (caché côté serveur après la 1re fois).
      let list = slidesRef.current;
      if (!list) {
        setStatus("writing");
        const r = await fetch(`/api/lessons/${lessonId}/speak`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode, section, format: "slides" }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Emma could not prepare this explanation.");
        list = (d.slides || []) as Slide[];
        if (!list.length) throw new Error("Emma could not prepare this explanation.");
        slidesRef.current = list;
      }
      setSlides(list);
      computeCum(list);

      // 2. La voix : toute la narration en un seul audio. Si la voix échoue,
      // les slides restent utilisables à la main (jamais un écran mort).
      if (!urlRef.current) {
        setStatus("voicing");
        const narration = list.map((s) => s.say.trim()).join(" ");
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: narration.slice(0, 4800) }),
        }).catch(() => null);
        if (r?.ok) urlRef.current = URL.createObjectURL(await r.blob());
      }
      if (!urlRef.current) { setStatus("paused"); return; }

      // 3. Lecture : la slide visible avance avec la voix.
      a.src = urlRef.current;
      a.ontimeupdate = () => {
        if (!a.duration) return;
        const f = a.currentTime / a.duration;
        const i = cumRef.current.findIndex((c) => f < c);
        setIdx(i === -1 ? cumRef.current.length - 1 : i);
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
    else if (status === "ended") { seekTo(0); }
  }

  // Saute au début de la slide i (fraction cumulée de la slide précédente).
  // Sans audio (voix indisponible), la navigation reste manuelle.
  function seekTo(i: number) {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    const a = audioRef.current;
    if (!a || !urlRef.current || !a.duration) { setIdx(clamped); return; }
    const from = clamped <= 0 ? 0 : cumRef.current[clamped - 1];
    a.currentTime = from * a.duration + 0.01;
    setIdx(clamped);
    a.play().then(() => setStatus("playing")).catch(() => {});
  }

  const busyMsg = status === "writing" || status === "voicing";

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
          <style>{`
            @keyframes ceSlideIn { 0% { opacity: 0; transform: translateY(14px) scale(.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
            .ce-slide { animation: ceSlideIn .45s cubic-bezier(.2,.8,.3,1); }
            .ce-screen .rich { font-size: 19px; line-height: 1.55; }
            .ce-screen .rich ul { padding-left: 1.2em; margin: .4em 0; list-style: none; }
            .ce-screen .rich li { margin: .45em 0; position: relative; padding-left: .35em; }
            .ce-screen .rich li::before { content: "▸"; color: #B45309; position: absolute; left: -0.85em; }
            .ce-screen .rich h2, .ce-screen .rich h3 { font-family: var(--font-serif, Georgia), serif; font-size: 22px; margin: 0 0 .35em; color: #064E3B; }
            .ce-screen .rich .katex-display { margin: .5em 0; }
            .ce-screen .rich .katex-display .katex { font-size: 1.35em; }
          `}</style>
          <div
            className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-indigo-deep"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Le studio : Emma + le titre du concept */}
            <div className="flex items-center gap-4 px-6 pt-5">
              <EmmaFace state={status === "playing" ? "speaking" : "idle"} size={72} />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber">Emma explains</p>
                <h3 className="font-serif font-bold text-lg text-white truncate">{title}</h3>
              </div>
              <button onClick={close} className="text-white/70 hover:text-white text-xl leading-none px-2" title="Close">✕</button>
            </div>

            {/* L'ÉCRAN : la slide du moment — vraies formules, bullets, animée */}
            <div className="mx-6 mt-4 h-64 rounded-2xl bg-white ce-screen flex items-center justify-center px-6 py-4 overflow-y-auto">
              {busyMsg && (
                <p className="text-indigo font-semibold text-[15px] animate-pulse text-center">{LOADER_MSGS[loaderIdx]}</p>
              )}
              {status === "error" && <p className="text-gap font-semibold text-sm text-center">{error}</p>}
              {!busyMsg && status !== "error" && slides[idx] && (
                <div key={idx} className="ce-slide w-full text-center">
                  <RichText text={slides[idx].show} />
                </div>
              )}
            </div>

            {/* Sous-titres : ce qu'Emma dit sur cette slide */}
            <div className="mx-6 mt-2 min-h-[40px] flex items-center justify-center">
              {!busyMsg && status !== "error" && slides[idx] && (
                <p className="text-white/75 text-[13.5px] italic text-center leading-snug">“{slides[idx].say}”</p>
              )}
            </div>

            {/* Points de progression — cliquables pour naviguer */}
            {slides.length > 0 && !busyMsg && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => seekTo(i)}
                    className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-amber" : "w-2 bg-white/30 hover:bg-white/60"}`}
                    title={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Contrôles */}
            <div className="flex items-center justify-center gap-3 px-6 py-4">
              {(status === "playing" || status === "paused" || status === "ended") && (
                <>
                  <button onClick={() => seekTo(idx - 1)} className="text-white/80 hover:text-white font-bold text-lg px-2" title="Previous">⏮</button>
                  <button onClick={toggle} className="bg-amber text-indigo-deep font-bold rounded-full w-12 h-12 text-lg hover:brightness-105 transition" title={status === "playing" ? "Pause" : "Play"}>
                    {status === "playing" ? "❚❚" : "▶"}
                  </button>
                  <button onClick={() => seekTo(idx + 1)} className="text-white/80 hover:text-white font-bold text-lg px-2" title="Next">⏭</button>
                </>
              )}
              {status === "ended" && (
                <button onClick={close} className="text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2 transition">
                  Got it ✓ — back to the lesson
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
