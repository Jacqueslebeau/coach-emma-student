"use client";

// TABLEAU BLANC de la leçon — l'espace de travail interactif : l'élève tape
// ses notes et ses calculs (LaTeX rendu en direct), tout est sauvegardé, et
// Emma LIT le tableau quand il lui pose une question (elle corrige ce qui y
// est faux). V1 tapée ; le dessin au stylet viendra ensuite.
import { useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";

export default function Whiteboard({ lessonId, initial }: { lessonId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial || "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <div className="px-5 pb-5 grid md:grid-cols-2 gap-4">
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
      )}
    </div>
  );
}
