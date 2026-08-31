"use client";

// LE MOTEUR VISUEL D'EMMA — une séquence de slides (vraies formules KaTeX,
// bullets, gras) jouée en rythme avec sa voix, sous-titres inclus. Réutilisé
// par : l'explainer d'un concept, les réponses orales aux questions, et le
// mode « Listen » de la leçon entière.
// L'élément Audio est FOURNI par le parent, déjà débloqué dans le clic
// utilisateur (autoplay policy) — jamais créé ici.
import { useCallback, useEffect, useRef, useState } from "react";
import EmmaFace from "@/components/EmmaFace";
import RichText from "@/components/RichText";

export type Slide = { show: string; say: string };
type Status = "voicing" | "playing" | "paused" | "ended";

export default function SlideShow({ title, kicker = "Emma explains", slides, audio, getAudioUrl, onClose, onEnded, footer }: {
  title: string;
  kicker?: string;                    // la petite ligne ambre au-dessus du titre
  slides: Slide[];
  audio: HTMLAudioElement | null;     // élément débloqué par le parent
  getAudioUrl: () => Promise<string | null>; // TTS (le parent peut précharger/cacher)
  onClose: () => void;
  onEnded?: () => void;               // enchaînement (mode Listen) — sinon статut "ended"
  footer?: React.ReactNode;           // contrôles additionnels du parent (ex. sections)
}) {
  const [status, setStatus] = useState<Status>("voicing");
  const [idx, setIdx] = useState(0);
  const [noVoice, setNoVoice] = useState(false);
  const cumRef = useRef<number[]>([]);
  const hasVoiceRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Poids de narration par slide → fractions cumulées pour la synchro.
  useEffect(() => {
    const lens = slides.map((s) => Math.max(8, s.say.length));
    const total = lens.reduce((a, b) => a + b, 0);
    let acc = 0;
    cumRef.current = lens.map((l) => (acc += l) / total);
  }, [slides]);

  // Lance la voix et la synchro. Sans voix (TTS indisponible), navigation manuelle.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("voicing");
      setIdx(0);
      const url = await getAudioUrl().catch(() => null);
      if (cancelled) return;
      if (!url || !audio) { hasVoiceRef.current = false; setNoVoice(true); setStatus("paused"); return; }
      hasVoiceRef.current = true;
      audio.src = url;
      audio.ontimeupdate = () => {
        if (!audio.duration) return;
        const f = audio.currentTime / audio.duration;
        const i = cumRef.current.findIndex((c) => f < c);
        setIdx(i === -1 ? cumRef.current.length - 1 : i);
      };
      audio.onended = () => {
        if (onEndedRef.current) onEndedRef.current();
        else setStatus("ended");
      };
      setStatus("playing");
      await audio.play().catch(() => setStatus("paused"));
    })();
    return () => { cancelled = true; audio?.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const toggle = useCallback(() => {
    if (!audio || !hasVoiceRef.current) return;
    if (status === "playing") { audio.pause(); setStatus("paused"); }
    else if (status === "paused") { audio.play().then(() => setStatus("playing")).catch(() => {}); }
    else if (status === "ended") { audio.currentTime = 0; setIdx(0); audio.play().then(() => setStatus("playing")).catch(() => {}); }
  }, [audio, status]);

  const seekTo = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    if (!audio || !hasVoiceRef.current || !audio.duration) { setIdx(clamped); return; }
    audio.currentTime = (clamped <= 0 ? 0 : cumRef.current[clamped - 1]) * audio.duration + 0.01;
    setIdx(clamped);
    audio.play().then(() => setStatus("playing")).catch(() => {});
  }, [audio, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <style>{`
        @keyframes ceSlideIn { 0% { opacity: 0; transform: translateY(14px) scale(.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .ce-slide { animation: ceSlideIn .45s cubic-bezier(.2,.8,.3,1); }
        .ce-screen .rich { font-size: 19px; line-height: 1.55; }
        .ce-screen .rich ul { padding-left: 1.2em; margin: .4em 0; list-style: none; }
        .ce-screen .rich li { margin: .45em 0; position: relative; padding-left: .35em; text-align: left; }
        .ce-screen .rich li::before { content: "▸"; color: #B45309; position: absolute; left: -0.85em; }
        .ce-screen .rich h2, .ce-screen .rich h3 { font-family: var(--font-serif, Georgia), serif; font-size: 22px; margin: 0 0 .35em; color: #064E3B; }
        .ce-screen .rich .katex-display { margin: .5em 0; }
        .ce-screen .rich .katex-display .katex { font-size: 1.35em; }
      `}</style>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl bg-indigo-deep" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 px-6 pt-5">
          <EmmaFace state={status === "playing" ? "speaking" : "idle"} size={72} />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-amber">{kicker}</p>
            <h3 className="font-serif font-bold text-lg text-white truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none px-2" title="Close">✕</button>
        </div>

        {/* L'ÉCRAN : le pop-up visuel du moment */}
        <div className="mx-6 mt-4 h-64 rounded-2xl bg-white ce-screen flex items-center justify-center px-6 py-4 overflow-y-auto">
          {status === "voicing" ? (
            <p className="text-indigo font-semibold text-[15px] animate-pulse text-center">🎙 Emma is warming up her voice…</p>
          ) : slides[idx] ? (
            <div key={idx} className="ce-slide w-full text-center">
              <RichText text={slides[idx].show} />
            </div>
          ) : null}
        </div>

        {/* Sous-titres */}
        <div className="mx-6 mt-2 min-h-[40px] flex items-center justify-center">
          {status !== "voicing" && slides[idx] && (
            <p className="text-white/75 text-[13.5px] italic text-center leading-snug">“{slides[idx].say}”</p>
          )}
        </div>
        {noVoice && (
          <p className="text-center text-amber/90 text-[12px] mt-1">
            🔇 Emma&apos;s voice is unavailable right now — browse the slides with ⏮ ⏭ and try again in a minute.
          </p>
        )}

        {/* Progression + contrôles */}
        {status !== "voicing" && (
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
        <div className="flex items-center justify-center gap-3 px-6 py-4">
          {status !== "voicing" && (
            <>
              <button onClick={() => seekTo(idx - 1)} className="text-white/80 hover:text-white font-bold text-lg px-2" title="Previous">⏮</button>
              <button onClick={toggle} className="bg-amber text-indigo-deep font-bold rounded-full w-12 h-12 text-lg hover:brightness-105 transition" title={status === "playing" ? "Pause" : "Play"}>
                {status === "playing" ? "❚❚" : "▶"}
              </button>
              <button onClick={() => seekTo(idx + 1)} className="text-white/80 hover:text-white font-bold text-lg px-2" title="Next">⏭</button>
            </>
          )}
          {status === "ended" && !onEnded && (
            <button onClick={onClose} className="text-white/80 hover:text-white font-semibold text-sm rounded-full border border-white/30 px-4 py-2 transition">
              Got it ✓
            </button>
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}
