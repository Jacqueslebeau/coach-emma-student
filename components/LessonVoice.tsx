"use client";

// LA LEÇON EN VOCAL — Emma lit le cours section par section (sa voix UK), le
// texte écrit reste affiché dessous comme sous-titres. L'élève peut METTRE EN
// PAUSE à tout moment (crucial), naviguer entre sections, et « Pause & ask
// Emma » suspend la lecture pour poser une question — puis on reprend.
import { useEffect, useRef, useState } from "react";
import EmmaFace from "@/components/EmmaFace";

type SectionRef = { key: string; title: string };

export default function LessonVoice({
  lessonId, mode, sections, onSectionChange, onAskEmma,
}: {
  lessonId: string;
  mode: "full" | "key";
  sections: SectionRef[]; // intro + concepts + recap, dans l'ordre de lecture
  onSectionChange?: (key: string | null) => void;
  onAskEmma?: () => void;
}) {
  const [idx, setIdx] = useState(-1);          // -1 = pas démarré
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef<Map<string, string>>(new Map()); // key -> object URL

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    a.onended = () => next();
    return () => { a.pause(); cache.current.forEach((u) => URL.revokeObjectURL(u)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAudio(sectionKey: string): Promise<string> {
    const hit = cache.current.get(sectionKey);
    if (hit) return hit;
    const sr = await fetch(`/api/lessons/${lessonId}/speak`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, section: sectionKey }),
    });
    const sd = await sr.json();
    if (!sr.ok) throw new Error(sd.error || "Could not prepare the narration");
    const tr = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: sd.script }),
    });
    if (!tr.ok) throw new Error((await tr.json().catch(() => ({}))).error || "Voice unavailable");
    const url = URL.createObjectURL(await tr.blob());
    cache.current.set(sectionKey, url);
    return url;
  }

  async function playIndex(i: number) {
    if (i < 0 || i >= sections.length) { stop(); return; }
    setIdx(i); setError(null); setLoading(true); setPlaying(true);
    onSectionChange?.(sections[i].key);
    try {
      const url = await loadAudio(sections[i].key);
      const a = audioRef.current!;
      a.src = url;
      await a.play();
      // Pré-charge la section suivante pendant que celle-ci joue.
      if (i + 1 < sections.length) loadAudio(sections[i + 1].key).catch(() => {});
    } catch (e) {
      setError((e as Error).message);
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  function pause() { audioRef.current?.pause(); setPlaying(false); }
  function resume() {
    if (idx < 0) { playIndex(0); return; }
    audioRef.current?.play().then(() => setPlaying(true)).catch(() => playIndex(idx));
  }
  function next() { playIndex(idx + 1 >= sections.length ? -2 : idx + 1); if (idx + 1 >= sections.length) stop(); }
  function prev() { playIndex(Math.max(0, idx - 1)); }
  function stop() { audioRef.current?.pause(); setPlaying(false); setIdx(-1); onSectionChange?.(null); }

  function askEmma() { pause(); onAskEmma?.(); }

  const current = idx >= 0 && idx < sections.length ? sections[idx] : null;

  return (
    <div className="card p-4 border-indigo bg-indigo-soft/30 sticky top-2 z-10">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="shrink-0"><EmmaFace state={playing ? "speaking" : "idle"} size={64} /></div>
        <button
          type="button"
          onClick={() => (playing ? pause() : resume())}
          className="btn-primary !rounded-full h-12 w-12 !p-0 text-xl shrink-0"
          title={playing ? "Pause" : "Play"}
        >
          {loading ? "…" : playing ? "❚❚" : "▶"}
        </button>
        <div className="flex-1 min-w-[180px]">
          <p className="font-semibold text-[14.5px]">
            {current
              ? `Emma is reading — ${current.title}`
              : idx === -1
                ? "Listen to this lesson 🎧 Emma reads it aloud — pause any time."
                : "Lesson read — over to the mastery check!"}
          </p>
          {current && (
            <p className="text-xs text-muted">Section {idx + 1}/{sections.length} · the written text follows below</p>
          )}
        </div>
        {current && (
          <div className="flex gap-1.5 shrink-0">
            <button type="button" onClick={prev} className="btn-ghost !py-1.5 !px-3 text-[13px]" title="Previous section">⏮</button>
            <button type="button" onClick={next} className="btn-ghost !py-1.5 !px-3 text-[13px]" title="Next section">⏭</button>
            <button type="button" onClick={askEmma} className="btn-amber !py-1.5 !px-3 text-[13px]">✋ Pause &amp; ask Emma</button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-gap font-semibold mt-2">{error}</p>}
    </div>
  );
}
