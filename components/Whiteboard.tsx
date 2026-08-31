"use client";

// TABLEAU BLANC partagé de la leçon (MATHS) — l'espace de travail : l'élève y
// tape ses calculs (LaTeX rendu en direct), et EMMA PEUT Y ÉCRIRE (opération
// posée, mini-exercice) quand on lui pose une question dans la case en bas —
// ses ajouts arrivent via l'événement "emma-board". L'élève répond directement
// sur le tableau. Tout est sauvegardé. V1 tapée ; le stylet viendra ensuite.
import { useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";

export default function Whiteboard({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial || "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Emma vient d'écrire au tableau (réponse à une question en bas) :
  // on remplace le contenu et on ouvre le tableau pour que l'élève le voie.
  useEffect(() => {
    const onEmma = (e: Event) => {
      const board = (e as CustomEvent<string>).detail;
      if (typeof board === "string") { setText(board); setSaved("saved"); setOpen(true); }
    };
    window.addEventListener("emma-board", onEmma);
    return () => window.removeEventListener("emma-board", onEmma);
  }, []);

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

  return (
    <div className="card mt-4 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left"
      >
        <span className="font-serif font-semibold text-[16px]">🖊️ Whiteboard <span className="text-faint font-sans text-[12.5px] font-normal">— shared working space: Emma reads it, and can write questions and workings on it</span></span>
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
                  <p className="text-faint text-sm">Your working appears here, with the maths typeset. If Emma wants to show you an operation or set you a quick one, she writes it here too — answer her right on the board.</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11.5px] text-faint mt-2">
            Questions go in the <strong>“Any questions?”</strong> box below — Emma reads this board when she answers, and she may write her working (or a quick question for you) up here.
          </p>
        </div>
      )}
    </div>
  );
}
