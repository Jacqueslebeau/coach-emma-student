"use client";

// Démo animée du hero (mécanique Coach Emma) : le vrai parcours du produit en
// 5 tableaux — capture → maîtrise → exercice examen → correction mark par mark
// → progression. Auto-rotation + points de progression. Bilingue FR/EN.
// Code couleur Coach Emma : émeraude / or / crème.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const EM = "#064E3B";
const GOLD = "#FACC15";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;

const T = {
  fr: {
    caps: [
      "1 · Il capture sa leçon du jour — titre, notes ou photo",
      "2 · Emma vérifie la maîtrise, concept par concept",
      "3 · Exercices style past paper, en conditions d'examen",
      "4 · Corrigé comme à l'examen : mark par mark",
      "5 · La progression, noir sur blanc",
    ],
    photoSent: "📷 Photo du cours envoyée ✓", lessonLabel: "LEÇON DU JOUR",
    conceptsLabel: "CONCEPTS IDENTIFIÉS · Edexcel 9MA0, Pure 7.2",
    st: ["acquis", "fragile", "à revoir"],
    remark: "« Chain rule fragile — je te la réexplique autrement, puis on re-vérifie. »",
    expect: "Ce que l'examinateur attend :", expectBody: "le résultat est donné — 100 % des marks sont dans le cheminement. Chaque étape écrite + une conclusion.",
    paper: "✍️ En ligne, ou sur papier + photo de la copie.",
    marks: ["M1 — chain rule posée", "A1 — dérivée exacte", "M1 — dy/dx = 0 résolu", "A1 — conclusion non écrite"],
    habit: "« Un “Show that” sans phrase finale perd son dernier mark — c'est l'habitude n°7 de celles qui coûtent l'A*. On la corrige. »",
    grades: ["Départ", "Actuel", "Objectif"],
    trend: "% de marks sur ses séries d'exercices — la preuve, pas la promesse.",
  },
  en: {
    caps: [
      "1 · He captures today's lesson — title, notes or a photo",
      "2 · Emma checks mastery, concept by concept",
      "3 · Past-paper style exercises, under exam conditions",
      "4 · Marked like the real exam: mark by mark",
      "5 · Progress, in black and white",
    ],
    photoSent: "📷 Photo of the lesson uploaded ✓", lessonLabel: "TODAY'S LESSON",
    conceptsLabel: "CONCEPTS IDENTIFIED · Edexcel 9MA0, Pure 7.2",
    st: ["secure", "fragile", "to revisit"],
    remark: "“Chain rule is fragile — I'll explain it another way, then re-check.”",
    expect: "What the examiner expects:", expectBody: "the result is given — 100% of the marks are in the working. Every step written + a conclusion.",
    paper: "✍️ Online, or on paper + a photo of the script.",
    marks: ["M1 — chain rule set up", "A1 — exact derivative", "M1 — dy/dx = 0 solved", "A1 — conclusion missing"],
    habit: "“A ‘Show that’ without a final statement loses its last mark — habit #7 of the A*-costing list. We fix it.”",
    grades: ["Start", "Current", "Target"],
    trend: "% of marks across his exercise sets — proof, not promises.",
  },
};

export default function HeroDemo({ lang = "fr" }: { lang?: Lang }) {
  const t = T[lang] || T.fr;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % 5), 5200);
    return () => clearInterval(id);
  }, []);

  const frame = (idx: number, node: React.ReactNode) => (
    <div
      style={{
        position: "absolute", inset: 0, padding: 22,
        opacity: i === idx ? 1 : 0, transform: i === idx ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .5s, transform .5s", pointerEvents: "none",
      }}
    >
      {node}
    </div>
  );

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden" style={{ boxShadow: "0 20px 50px -30px rgba(6,78,59,.5)" }}>
      <div style={{ position: "relative", height: 330 }}>
        {frame(0,
          <div>
            <Cap>{t.caps[0]}</Cap>
            <div className="flex items-center gap-2.5 mt-3.5">
              <span className="w-9 h-9 rounded-full bg-indigo-soft text-indigo font-bold flex items-center justify-center text-sm">M</span>
              <div>
                <div className="font-bold text-[13px]" style={{ color: EM }}>Max</div>
                <div className="text-[11px] text-mastered">{t.photoSent}</div>
              </div>
            </div>
            <Field label={t.lessonLabel} value="Differentiation — chain rule" />
            <div className="mt-3">
              <div className="text-[11px] font-bold text-faint">{t.conceptsLabel}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["Composite functions", "Chain rule", "Trig chains", "Reverse chain rule"].map((c) => (
                  <span key={c} className="chip-todo !text-[11px]">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {frame(1,
          <div>
            <Cap>{t.caps[1]}</Cap>
            <div className="mt-3 space-y-2.5">
              {[
                ["Composite functions", 100, t.st[0], "#1f9d6b"],
                ["Chain rule", 78, t.st[1], "#c8891a"],
                ["Trig chains", 55, t.st[2], "#d85440"],
              ].map(([l, v, s, col]) => (
                <div key={l as string}>
                  <div className="flex justify-between text-[12px] font-bold" style={{ color: EM }}>
                    <span>{l}</span><span style={{ color: col as string }}>{s}</span>
                  </div>
                  <div className="h-1.5 bg-paper rounded mt-1">
                    <div className="h-1.5 rounded" style={{ width: `${v}%`, background: GOLD }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-indigo-soft rounded-xl px-3.5 py-2.5 text-[12.5px] leading-snug" style={{ color: EM }}>
              {t.remark}
            </div>
          </div>
        )}
        {frame(2,
          <div>
            <Cap>{t.caps[2]}</Cap>
            <div className="mt-3 border border-line rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="chip bg-amber-soft text-amber font-mono !text-[10.5px]">“Show that”</span>
                <span className="chip-todo !text-[10.5px]">4 marks · ~5 min</span>
              </div>
              <p className="text-[12.5px] mt-2 leading-snug text-ink">
                Show that the curve y = (2x − 3)⁴ has a stationary point at x = 3⁄2.
              </p>
            </div>
            <p className="text-[11.5px] text-muted mt-2.5 leading-snug">
              🎯 <b>{t.expect}</b> {t.expectBody}
            </p>
            <p className="text-[11.5px] text-faint mt-2">{t.paper}</p>
          </div>
        )}
        {frame(3,
          <div>
            <Cap>{t.caps[3]}</Cap>
            <div className="flex items-baseline gap-2 mt-2.5">
              <span style={{ ...serif, fontSize: 38, fontWeight: 600, color: EM }}>3<span style={{ fontSize: 17 }}>/4</span></span>
              <span className="chip-fragile">marks</span>
            </div>
            <div className="mt-2 space-y-1 text-[12px]">
              <Mark ok label={t.marks[0]} />
              <Mark ok label={t.marks[1]} />
              <Mark ok label={t.marks[2]} />
              <Mark label={t.marks[3]} />
            </div>
            <div className="mt-2.5 bg-amber-soft rounded-xl px-3 py-2 text-[11.5px] leading-snug" style={{ color: "#6b6110" }}>
              {t.habit}
            </div>
          </div>
        )}
        {frame(4,
          <div>
            <Cap>{t.caps[4]}</Cap>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Grade label={t.grades[0]} v="C" color="#9a948a" />
              <span className="text-faint">→</span>
              <Grade label={t.grades[1]} v="A" color={EM} />
              <span className="text-faint">→</span>
              <Grade label={t.grades[2]} v="A*" color="#b58a00" />
            </div>
            <div className="flex items-end justify-center gap-1 mt-4" style={{ height: 34 }}>
              {[42, 55, 50, 63, 71, 68, 79, 84].map((h, k) => (
                <span key={k} className="rounded-t" style={{ width: 9, height: h * 0.4, background: k === 7 ? GOLD : EM, opacity: 0.5 + k * 0.06 }} />
              ))}
            </div>
            <p className="text-center text-[11.5px] text-muted mt-2">{t.trend}</p>
          </div>
        )}
      </div>
      <div className="flex justify-center gap-1.5 pb-4">
        {[0, 1, 2, 3, 4].map((k) => (
          <span key={k} style={{ width: i === k ? 18 : 6, height: 6, borderRadius: 3, background: i === k ? GOLD : "#e0dccf", transition: "width .4s, background .4s" }} />
        ))}
      </div>
    </div>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-wider text-amber leading-snug" style={{ minHeight: 30 }}>{children}</div>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold text-faint">{label}</div>
      <div className="mt-1 border border-line rounded-lg px-3 py-2 text-[13px]" style={{ color: EM }}>{value}</div>
    </div>
  );
}
function Mark({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? "text-mastered font-bold" : "text-gap font-bold"}>{ok ? "✓" : "✗"}</span>
      <span className={ok ? "text-muted" : "text-gap font-semibold"}>{label}</span>
    </div>
  );
}
function Grade({ label, v, color }: { label: string; v: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] font-mono uppercase tracking-wider text-faint">{label}</div>
      <div style={{ ...serif, fontSize: 30, fontWeight: 900, color }}>{v}</div>
    </div>
  );
}
