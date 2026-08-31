"use client";

// « 🎬 Watch Emma explain » — la mini-vidéo générée d'UN concept : storyboard
// de slides visuelles (vraies formules KaTeX, bullets) joué par SlideShow.
// L'audio est débloqué DANS le clic d'ouverture (autoplay policy), les
// contenus (storyboard + voix) sont cachés après la première ouverture.
import { useEffect, useRef, useState } from "react";
import SlideShow, { type Slide } from "@/components/SlideShow";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

const LOADER_MSGS = [
  "🎬 Emma is storyboarding this concept…",
  "✍️ Writing the key formula on the board…",
  "🎙 Warming up her voice…",
  "✨ Almost there…",
];

export default function ConceptExplainer({ lessonId, mode, section, title, compact = false }: {
  lessonId: string;
  mode: "full" | "key";
  section: string;          // "intro" | concept_key | "recap"
  title: string;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<"closed" | "loading" | "open" | "error">("closed");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loaderIdx, setLoaderIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const slidesRef = useRef<Slide[] | null>(null);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setLoaderIdx((i) => (i + 1) % LOADER_MSGS.length), 2600);
    return () => clearInterval(t);
  }, [phase]);

  async function open() {
    const a = audioRef.current;
    // DÉBLOCAGE dans le clic, avant tout await.
    if (a) { a.src = SILENT_WAV; a.play().catch(() => {}); }
    setError(null);
    try {
      let list = slidesRef.current;
      if (!list) {
        setPhase("loading");
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
      setPhase("open");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  // TTS de la narration — caché pour les relectures.
  async function getAudioUrl(): Promise<string | null> {
    if (urlRef.current) return urlRef.current;
    const list = slidesRef.current || [];
    const narration = list.map((s) => s.say.trim()).join(" ");
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: narration.slice(0, 4800) }),
    }).catch(() => null);
    if (!r?.ok) return null;
    urlRef.current = URL.createObjectURL(await r.blob());
    return urlRef.current;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { if (phase === "closed" || phase === "error") open(); }}
        className={
          compact
            ? "inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo hover:text-indigo-deep bg-indigo-soft hover:bg-amber-soft rounded-full px-3 py-1 transition"
            : "btn-ghost !py-1.5 !px-3.5 text-[13px]"
        }
        title={`Emma explains “${title}” — short video`}
      >
        🎬 <span>Watch Emma explain</span>
      </button>

      {(phase === "loading" || phase === "error") && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPhase("closed")}>
          <div className="w-full max-w-md rounded-3xl bg-indigo-deep px-8 py-10 text-center" onClick={(e) => e.stopPropagation()}>
            {phase === "loading" ? (
              <p className="text-amber font-semibold text-[15px] animate-pulse">{LOADER_MSGS[loaderIdx]}</p>
            ) : (
              <>
                <p className="text-white/90 text-sm">{error}</p>
                <button onClick={() => setPhase("closed")} className="mt-4 text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2">Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "open" && (
        <SlideShow
          title={title}
          slides={slides}
          audio={audioRef.current}
          getAudioUrl={getAudioUrl}
          onClose={() => { audioRef.current?.pause(); setPhase("closed"); }}
        />
      )}
    </>
  );
}
