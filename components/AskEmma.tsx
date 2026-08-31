"use client";

// « Any questions? » — la main levée du vrai tutoring. Fenêtres bornées
// (3 questions max par étape), Emma répond ancrée sur la leçon et ramène
// toujours vers la suite. Elle répond À L'ORAL (sa voix) en plus de l'écrit ;
// l'audio est débloqué dans le submit (autoplay policy).
import { useEffect, useState } from "react";
import RichText from "@/components/RichText";
import { useEmmaAudio } from "@/lib/useEmmaAudio";

type QA = { id?: string; stage: string; question: string; answer: string };

const STAGE_PROMPT: Record<string, string> = {
  course: "Any questions on the lesson before the mastery check?",
  "quiz-result": "Any questions about the feedback?",
  "exercise-result": "Any questions about the marking?",
};

export default function AskEmma({ lessonId, stage }: { lessonId: string; stage: "course" | "quiz-result" | "exercise-result" }) {
  const [qas, setQas] = useState<QA[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const voice = useEmmaAudio();

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/ask`)
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => setQas((d.questions || []).filter((q: QA) => q.stage === stage)))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [lessonId, stage]);

  const left = Math.max(0, 3 - qas.length);

  async function ask() {
    const q = input.trim();
    if (!q || busy || left === 0) return;
    voice.unlock(); // dans le geste utilisateur, avant tout await
    setBusy(true); setError(null); setInput("");
    try {
      const r = await fetch(`/api/lessons/${lessonId}/ask`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, stage }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Emma could not answer — try again.");
      setQas((x) => [...x, { stage, question: q, answer: d.answer }]);
      // Emma a écrit au tableau blanc partagé (maths) → le tableau se met à jour.
      if (d.whiteboard) window.dispatchEvent(new CustomEvent("emma-board", { detail: d.whiteboard }));
      voice.speak(String(d.answer || ""), true); // Emma répond à voix haute aussi
    } catch (e) {
      setError((e as Error).message);
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="card p-5 mt-4 border-indigo/40">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="font-serif font-semibold text-[16px]">🙋 {STAGE_PROMPT[stage]}</p>
        <span className="font-mono text-[11px] text-faint">{left} question{left === 1 ? "" : "s"} left in this window</span>
      </div>

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

      {(voice.state === "loading" || voice.state === "playing" || voice.state === "paused") && (
        <div className="flex items-center gap-2 mt-3">
          <span className="text-[12.5px] text-indigo font-semibold">
            {voice.state === "loading" ? "🔊 Emma is about to answer out loud…" : "🔊 Emma is answering out loud"}
          </span>
          {voice.state === "playing" && (
            <button onClick={voice.pause} className="text-indigo hover:text-indigo-deep text-sm font-bold" title="Pause">❚❚</button>
          )}
          {voice.state === "paused" && (
            <button onClick={voice.resume} className="text-indigo hover:text-indigo-deep text-sm font-bold" title="Resume">▶</button>
          )}
          {voice.state !== "loading" && (
            <button onClick={voice.stop} className="text-faint hover:text-indigo text-sm font-bold" title="Stop">✕</button>
          )}
        </div>
      )}

      {busy && <p className="text-sm text-faint mt-3">Emma is thinking…</p>}
      {error && <p className="text-sm text-gap font-semibold mt-3">{error}</p>}

      {left > 0 ? (
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-3 flex gap-2">
          <input
            className="input flex-1 !py-2"
            placeholder="Ask Emma about this lesson…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="btn-primary !py-2 !px-4 text-[13.5px]" disabled={busy || !input.trim()}>Ask</button>
        </form>
      ) : (
        <p className="text-sm text-muted mt-3 bg-amber-soft rounded-xl px-3.5 py-2.5">
          Question window closed — Emma keeps the session moving. Anything left over goes to the next step or a coaching session.
        </p>
      )}
    </div>
  );
}
