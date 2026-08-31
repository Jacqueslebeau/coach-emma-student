"use client";

// TABLEAU BLANC de la leçon — l'espace de travail interactif : l'élève tape
// ses notes et ses calculs (LaTeX rendu en direct), tout est sauvegardé, et
// Emma LIT le tableau quand il lui pose une question (elle corrige ce qui y
// est faux). Bouton « Ask Emma » intégré : la question part avec le tableau
// en contexte, Emma répond à l'écrit ET à l'oral. V1 tapée ; le dessin au
// stylet viendra ensuite.
import { useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";
import { useEmmaAudio } from "@/lib/useEmmaAudio";

export default function Whiteboard({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial || "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voice = useEmmaAudio();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function onChange(v: string) {
    setText(v);
    setSaved("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await fetch(`/api/lessons/${lessonId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ whiteboard: v }),
        });
        setSaved("saved");
      } catch {
        setSaved("idle");
      }
    }, 800);
  }

  // Envoie la question à Emma AVEC le tableau en contexte (elle le lit côté
  // serveur). S'assure d'abord que la dernière version du tableau est sauvée.
  async function askEmma() {
    const q = question.trim() || "Can you check my working on the whiteboard? Point out any mistake.";
    if (asking) return;
    voice.unlock(); // dans le clic, avant les await
    setAsking(true); setAskError(null); setAnswer(null);
    try {
      if (timer.current) clearTimeout(timer.current);
      await fetch(`/api/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ whiteboard: text }),
      }).catch(() => {});
      setSaved("saved");
      const r = await fetch(`/api/lessons/${lessonId}/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: `[From the whiteboard] ${q}`, stage: "course" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Emma could not answer — try again.");
      setAnswer(String(d.answer || ""));
      setQuestion("");
      voice.speak(String(d.answer || ""), true);
    } catch (e) {
      setAskError((e as Error).message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="card mt-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-serif font-semibold text-[16px]">🖊️ Whiteboard <span className="text-faint font-sans text-[12.5px] font-normal">— your working space (Emma reads it when you ask a question)</span></span>
        <span className="flex items-center gap-3">
          {saved === "saving" && <span className="font-mono text-[11px] text-faint">saving…</span>}
          {saved === "saved" && <span className="font-mono text-[11px] text-mastered">saved ✓</span>}
          <span className={`text-[11px] text-faint transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-1.5">You write</p>
              <textarea
                className="input min-h-[220px] font-mono !text-[13.5px] leading-relaxed"
                placeholder={"Type your working here…\nMaths renders live: \\( y = (3x^2-1)^5 \\)\n**bold**, lists with -"}
                value={text}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-1.5">The board</p>
              <div className="min-h-[220px] rounded-xl border border-line bg-white px-4 py-3 overflow-y-auto">
                {text.trim() ? (
                  <RichText text={text} className="text-[14.5px]" />
                ) : (
                  <p className="text-faint text-sm">Your notes and working appear here, with the maths typeset.</p>
                )}
              </div>
            </div>
          </div>

          {/* La main levée depuis le tableau : Emma lit le board et répond (voix + écrit). */}
          <form onSubmit={(e) => { e.preventDefault(); askEmma(); }} className="mt-3 flex gap-2 flex-wrap">
            <input
              className="input flex-1 min-w-[220px] !py-2"
              placeholder="Ask Emma about this working… (or leave blank: she checks the board)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={asking}
            />
            <button className="btn-primary !py-2 !px-4 text-[13.5px]" disabled={asking}>
              {asking ? "Emma is reading your board…" : "🙋 Ask Emma"}
            </button>
          </form>
          {askError && <p className="text-sm text-gap font-semibold mt-2">{askError}</p>}

          {answer && (
            <div className="mt-3 bg-indigo-soft rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-semibold text-indigo">Emma{voice.state === "playing" ? " — speaking 🔊" : ""}</span>
                {voice.state === "playing" && (
                  <button type="button" onClick={voice.pause} className="text-indigo hover:text-indigo-deep text-xs font-bold" title="Pause">❚❚</button>
                )}
                {voice.state === "paused" && (
                  <button type="button" onClick={voice.resume} className="text-indigo hover:text-indigo-deep text-xs font-bold" title="Resume">▶</button>
                )}
              </div>
              <RichText text={answer} className="text-[14px]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
