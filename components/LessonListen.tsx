"use client";

// MODE « LISTEN » — Emma PRÉSENTE la leçon : elle parle, et à chaque idée un
// pop-up visuel sort de la page (la formule, les bullets, le piège ⚠️).
// Section par section (intro → concepts → recap), enchaînées automatiquement ;
// la suivante se précharge pendant que l'actuelle joue. L'élève qui préfère
// lire ferme et retrouve le texte — jamais les deux en même temps.
import { useCallback, useEffect, useRef, useState } from "react";
import SlideShow, { type Slide } from "@/components/SlideShow";

type Section = { key: string; title: string };
type Pack = { slides: Slide[]; url: string | null };

export default function LessonListen({ lessonId, mode, sections, audio, onClose }: {
  lessonId: string;
  mode: "full" | "key";
  sections: Section[];
  audio: HTMLAudioElement | null; // débloqué par le parent DANS le clic 🎧
  onClose: () => void;
}) {
  const [secIdx, setSecIdx] = useState(0);
  const [pack, setPack] = useState<Pack | null>(null);
  const [state, setState] = useState<"loading" | "playing" | "finished" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Pack>>(new Map());

  // Charge (ou lit du cache) le contenu d'une section : slides + voix.
  const loadSection = useCallback(async (i: number): Promise<Pack | null> => {
    const sec = sections[i];
    if (!sec) return null;
    const hit = cacheRef.current.get(sec.key);
    if (hit) return hit;
    const r = await fetch(`/api/lessons/${lessonId}/speak`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, section: sec.key, format: "slides" }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !Array.isArray(d.slides) || !d.slides.length) {
      throw new Error(d.error || "Emma could not prepare this part.");
    }
    const narration = (d.slides as Slide[]).map((s) => s.say.trim()).join(" ");
    const tts = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: narration.slice(0, 4800) }),
    }).catch(() => null);
    const p: Pack = { slides: d.slides, url: tts?.ok ? URL.createObjectURL(await tts.blob()) : null };
    cacheRef.current.set(sec.key, p);
    return p;
  }, [lessonId, mode, sections]);

  // Section courante + PRÉCHARGEMENT de la suivante pendant la lecture.
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    loadSection(secIdx)
      .then((p) => {
        if (cancelled || !p) return;
        setPack(p);
        setState("playing");
        loadSection(secIdx + 1).catch(() => {}); // préchauffe, jamais bloquant
      })
      .catch((e) => { if (!cancelled) { setError((e as Error).message); setState("error"); } });
    return () => { cancelled = true; };
  }, [secIdx, loadSection]);

  // Libère les URLs audio à la fermeture.
  useEffect(() => {
    const cache = cacheRef.current;
    return () => { cache.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url); }); };
  }, []);

  const next = useCallback(() => {
    if (secIdx + 1 < sections.length) setSecIdx((i) => i + 1);
    else setState("finished");
  }, [secIdx, sections.length]);

  if (state === "loading" || state === "error" || state === "finished") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-3xl bg-indigo-deep px-8 py-10 text-center" onClick={(e) => e.stopPropagation()}>
          {state === "loading" && (
            <>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber">{sections[secIdx]?.title}</p>
              <p className="text-white font-semibold text-[15px] animate-pulse mt-2">🎬 Emma is preparing this part…</p>
              <p className="text-white/60 text-xs mt-2">Part {secIdx + 1} of {sections.length}</p>
            </>
          )}
          {state === "error" && (
            <>
              <p className="text-white/90 text-sm">{error}</p>
              <button onClick={onClose} className="mt-4 text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2">Back to reading</button>
            </>
          )}
          {state === "finished" && (
            <>
              <p className="text-amber font-semibold">🎉 That&apos;s the whole lesson!</p>
              <p className="text-white/75 text-sm mt-2">Next step: check your mastery — that&apos;s where it sticks.</p>
              <button onClick={onClose} className="mt-4 bg-amber text-indigo-deep font-bold rounded-full px-5 py-2.5">Back to the lesson ✓</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return pack ? (
    <SlideShow
      key={sections[secIdx].key}
      title={sections[secIdx].title}
      kicker={`Emma presents · part ${secIdx + 1}/${sections.length}`}
      slides={pack.slides}
      audio={audio}
      getAudioUrl={async () => pack.url}
      onClose={onClose}
      onEnded={next}
      footer={
        <button
          onClick={next}
          className="text-white/70 hover:text-white font-semibold text-[12.5px] rounded-full border border-white/25 px-3.5 py-1.5 transition ml-2"
          title="Skip to the next part"
        >
          Next part →
        </button>
      }
    />
  ) : null;
}
