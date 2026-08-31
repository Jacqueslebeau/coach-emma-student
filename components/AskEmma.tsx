"use client";

// « Any questions? » — la main levée du vrai tutoring. Fenêtres bornées
// (3 questions max par étape). L'élève CHOISIT le format de la réponse :
// ✍️ écrit (texte seul, pas de voix) ou 🎙 oral (Emma répond de vive voix,
// soutenue par des slides visuelles — formule, bullets — jamais un pavé).
// L'audio est débloqué dans le clic (autoplay policy).
import { useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";
import SlideShow, { type Slide } from "@/components/SlideShow";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

type QA = { id?: string; stage: string; question: string; answer: string };

const STAGE_PROMPT: Record<string, string> = {
  course: "Any questions on the lesson before the mastery check?",
  "quiz-result": "Any questions about the feedback?",
  "exercise-result": "Any questions about the marking?",
};

export default function AskEmma({ lessonId, stage }: { lessonId: string; stage: "course" | "quiz-result" | "exercise-result" }) {
  const [qas, setQas] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<false | "text" | "spoken">(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [show, setShow] = useState<{ slides: Slide[]; question: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const a = new Audio();
    audioRef.current = a;
    return () => {
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/ask`)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => setQas((d.questions || []).filter((q: QA) => q.stage === stage)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [lessonId, stage]);

  const left = Math.max(0, 3 - qas.length);

  async function ask(mode: "text" | "spoken") {
    const q = input.trim();
    if (!q || busy || left === 0) return;
    if (mode === "spoken") {
      // Déblocage audio DANS le clic, avant tout await.
      const a = audioRef.current;
      if (a) { a.src = SILENT_WAV; a.play().catch(() => {}); }
      if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    }
    setBusy(mode); setError(null); setInput("");
    try {
      const r = await fetch(`/api/lessons/${lessonId}/ask`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, stage, mode }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Emma could not answer — try again.");
      setQas((x) => [...x, { stage, question: q, answer: d.answer }]);
      if (mode === "spoken" && Array.isArray(d.slides) && d.slides.length) {
        setShow({ slides: d.slides, question: q });
      }
    } catch (e) {
      setError((e as Error).message);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  async function getAudioUrl(): Promise<string | null> {
    if (urlRef.current) return urlRef.current;
    const narration = (show?.slides || []).map((s) => s.say.trim()).join(" ");
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: narration.slice(0, 4800) }),
    }).catch(() => null);
    if (!r?.ok) return null;
    urlRef.current = URL.createObjectURL(await r.blob());
    return urlRef.current;
  }

  if (!loaded) return null;

  return (
    <div className="card p-5 mt-4 border-indigo/40">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="font-serif font-semibold text-[16px]">
          🙋 {STAGE_PROMPT[stage]}
          <button
            type="button"
            onClick={() => setHelpOpen((o) => !o)}
            className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full border border-line text-[11px] font-sans text-faint hover:text-indigo hover:border-indigo align-middle"
            title="What is this for?"
          >?</button>
        </p>
        <span className="font-mono text-[11px] text-faint">{left} question{left === 1 ? "" : "s"} left in this window</span>
      </div>

      {helpOpen && (
        <div className="mt-2 bg-indigo-soft rounded-xl px-3.5 py-2.5 text-[13px] text-indigo-deep">
          This is your <strong>hand-raise moment</strong>, like with a real tutor: anything unclear in this step, ask it here before moving on.
          Emma answers using this lesson. It&apos;s capped at <strong>3 questions per step</strong> so the session keeps moving — bigger questions
          become their own lesson or a coaching topic. Choose <strong>✍️ Written</strong> for a written answer, or <strong>🎙 Out loud</strong> and
          Emma answers with her voice, supported by visuals.
        </div>
      )}

      {qas.length > 0 && (
        <div className="mt-3 space-y-3">
          {qas.map((qa, i) => (
            <div key={qa.id || i} className="space-y-2">
              <div className="flex justify-end">
                <p className="bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%] text-[14px]">{qa.question}</p>
              </div>
              <div className="flex justify-start">
                <div className="bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[92%]">
                  <RichText text={qa.answer} className="text-[14px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {busy && (
        <p className="text-sm text-faint mt-3 animate-pulse">
          {busy === "spoken" ? "🎙 Emma is preparing her answer — she'll talk you through it…" : "Emma is thinking…"}
        </p>
      )}
      {error && <p className="text-sm text-gap font-semibold mt-3">{error}</p>}

      {left > 0 ? (
        <form onSubmit={(e) => { e.preventDefault(); ask("spoken"); }} className="mt-3">
          <input
            className="input w-full !py-2"
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!busy}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => ask("text")}
              className="btn-ghost !py-2 !px-4 text-[13.5px] flex-1"
              disabled={!!busy || !input.trim()}
              title="Emma answers in writing"
            >
              ✍️ Written answer
            </button>
            <button
              type="submit"
              className="btn-primary !py-2 !px-4 text-[13.5px] flex-1"
              disabled={!!busy || !input.trim()}
              title="Emma answers out loud, with visuals"
            >
              🎙 Emma answers out loud
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted mt-3 bg-amber-soft rounded-xl px-3.5 py-2.5">
          Question window closed — Emma keeps the session moving. Anything left over goes to the next step or a coaching session.
        </p>
      )}

      {show && (
        <SlideShow
          title={show.question.length > 60 ? show.question.slice(0, 57) + "…" : show.question}
          kicker="Emma answers"
          slides={show.slides}
          audio={audioRef.current}
          getAudioUrl={getAudioUrl}
          onClose={() => { audioRef.current?.pause(); setShow(null); }}
        />
      )}
    </div>
  );
}
