"use client";

// « Voir la démo » — 3 démos scénarisées (mécanique Coach Emma), au choix :
// 1 · LE PRODUIT : ce qu'est Coach Emma Student, en 3 tableaux.
// 2 · UNE SÉANCE DE TUTORING : la vraie séance de Max, tableau par tableau.
// 3 · UNE SÉANCE DE COACHING : Emma coach d'examen, en dialogue.
// Auto-avancée avec légendes, bilingue FR/EN, code couleur Coach Emma.
// (La narration voix arrivera avec la clé ElevenLabs — même principe que les
// clips d_*.mp3 d'Emma.)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import type { Lang } from "@/lib/i18n";

const EM = "#064E3B";
const EM2 = "#0c6a4e";
const GOLD = "#FACC15";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;

type Shot = { cap: string; secs: number; scene: React.ReactNode };
export type Chapter = "product" | "tutoring" | "coaching";

function EmmaMark() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: EM, border: `3px solid ${GOLD}` }}>
        <span style={{ ...serif, color: "#FAF8F3", fontSize: 26, fontWeight: 900 }}>E</span>
      </span>
    </div>
  );
}

function Bubble({ who, name, children }: { who: "emma" | "max"; name?: string; children: React.ReactNode }) {
  return (
    <div className={who === "max" ? "flex justify-end" : "flex justify-start"}>
      <div className="max-w-[92%]">
        {name && (
          <p className={`text-[10.5px] font-bold uppercase tracking-wider text-faint mb-0.5 ${who === "max" ? "text-right" : ""}`}>{name}</p>
        )}
        <div
          className={
            who === "max"
              ? "text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[14px]"
              : "bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 text-[14px] text-ink"
          }
          style={who === "max" ? { background: EM2 } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapitre 1 · LE PRODUIT
// ---------------------------------------------------------------------------
function productShots(lang: Lang): Shot[] {
  const fr = lang === "fr";
  return [
    {
      cap: fr ? "Coach Emma Student — le tutorat personnel qui vise le A*" : "Coach Emma Student — personal tutoring that aims for the A*",
      secs: 8,
      scene: (
        <div className="text-center pt-6">
          <EmmaMark />
          <h3 style={{ ...serif, fontWeight: 900, fontSize: 23, color: EM }} className="mt-4">
            {fr ? "Un tuteur personnel, pas une app de fiches." : "A personal tutor, not a flashcard app."}
          </h3>
          <p className="text-muted text-[14px] mt-2 max-w-sm mx-auto leading-relaxed">
            {fr
              ? "Emma part de la leçon vue en classe, construit le cours, vérifie la compréhension, entraîne en conditions d'examen et corrige comme l'examinateur. Et elle coache l'élève jusqu'au jour J."
              : "Emma starts from the lesson covered in class, writes the course, checks understanding, trains under exam conditions and marks like the examiner. And she coaches the student all the way to exam day."}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "Calibré sur l'exam board de l'élève — Edexcel, AQA ou OCR" : "Calibrated to the student's exam board — Edexcel, AQA or OCR",
      secs: 8,
      scene: (
        <div className="max-w-md mx-auto pt-4 text-center">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {["Maths", "Economics", "Geography", "French"].map((s) => (
              <span key={s} className="chip-todo">{s}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {["Edexcel", "AQA", "OCR"].map((b) => (
              <span key={b} className="chip bg-amber-soft text-amber font-mono">{b}</span>
            ))}
          </div>
          <p className="text-muted text-[13.5px] mt-4 max-w-sm mx-auto leading-relaxed">
            {fr
              ? "À l'inscription, l'élève choisit ses matières, son board, son niveau actuel et son objectif. Emma génère un plan d'action par matière — et tout (cours, exercices, corrections) suit le spec officiel de SON board."
              : "At sign-up, the student picks their subjects, board, current level and target. Emma generates an action plan per subject — and everything (courses, exercises, marking) follows THEIR board's official spec."}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "La progression est mesurée — et visible par les parents" : "Progress is measured — and visible to parents",
      secs: 9,
      scene: (
        <div className="max-w-md mx-auto pt-3">
          <div className="flex items-center justify-center gap-5">
            {([[fr ? "Départ" : "Start", "C", "#9a948a"], [fr ? "Actuel" : "Current", "A", EM], [fr ? "Objectif" : "Target", "A*", "#b58a00"]] as const).map(([l, v, c], k) => (
              <div key={l} className="flex items-center gap-5">
                {k > 0 && <span className="text-faint text-xl">→</span>}
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-faint">{l}</div>
                  <div style={{ ...serif, fontSize: 34, fontWeight: 900, color: c }}>{v}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-muted text-[13.5px] mt-4 max-w-sm mx-auto leading-relaxed text-center">
            {fr
              ? "Tableau de bord par matière : maîtrise concept par concept, points à travailler, historique des séances par semaine ou par mois. Les parents donnent leur consentement à l'inscription et peuvent recevoir le récapitulatif."
              : "A dashboard per subject: mastery concept by concept, points to work on, session history by week or month. Parents give consent at sign-up and can receive the summary."}
          </p>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Chapitre 2 · UNE SÉANCE DE TUTORING (la séance de Max)
// ---------------------------------------------------------------------------
function tutoringShots(lang: Lang): Shot[] {
  const fr = lang === "fr";
  return [
    {
      cap: fr ? "Une vraie séance de tutoring — Max, A Level Maths" : "A real tutoring session — Max, A Level Maths",
      secs: 5,
      scene: (
        <div className="text-center pt-8">
          <EmmaMark />
          <h3 style={{ ...serif, fontWeight: 900, fontSize: 24, color: EM }} className="mt-4">
            {fr ? "Mardi, 18h04." : "Tuesday, 6:04pm."}
          </h3>
          <p className="text-muted text-[14.5px] mt-2 max-w-sm mx-auto leading-relaxed">
            {fr
              ? <>Max a vu la <b>chain rule</b> en classe aujourd'hui. Voici sa séance avec Emma — exactement comme dans l'outil.</>
              : <>Max covered the <b>chain rule</b> in class today. Here's his session with Emma — exactly as it happens in the tool.</>}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "1 · Il capture sa leçon : le titre, ses notes, ou une photo du cours" : "1 · He captures his lesson: the title, his notes, or a photo",
      secs: 6,
      scene: (
        <div className="max-w-sm mx-auto pt-2">
          <div className="border border-line rounded-2xl p-5 bg-white">
            <div className="text-[11px] font-bold text-faint">{fr ? "TITRE DE LA LEÇON" : "LESSON TITLE"}</div>
            <div className="mt-1 rounded-xl px-3.5 py-2.5 text-[14px]" style={{ border: `1px solid ${EM}`, color: EM }}>
              Differentiation — chain rule
            </div>
            <div className="text-[11px] font-bold text-faint mt-4">{fr ? "PHOTO DU COURS" : "PHOTO OF THE LESSON"}</div>
            <div className="mt-1 border border-dashed border-line rounded-xl px-3.5 py-3 text-[13px] text-mastered bg-mastered-bg/40">
              📷 IMG_2841.jpg — {fr ? "la page de son cahier" : "his notebook page"} ✓
            </div>
            <div className="mt-5 rounded-xl text-center font-bold py-2.5 text-[14px]" style={{ background: "linear-gradient(180deg,#FFDD57,#FACC15)", color: EM }}>
              {fr ? "C'est parti →" : "Let's go →"}
            </div>
          </div>
        </div>
      ),
    },
    {
      cap: fr ? "Emma lit son cours et identifie les concepts du programme Edexcel" : "Emma reads his notes and maps the Edexcel spec concepts",
      secs: 6,
      scene: (
        <div className="max-w-md mx-auto pt-3 space-y-3">
          <Bubble who="emma" name="Emma">
            {fr
              ? <>C'est la leçon <b>Pure 7.2 du spec Edexcel 9MA0</b>. Je la découpe en 4 concepts — on va les sécuriser un par un :</>
              : <>This is <b>Pure 7.2 of the Edexcel 9MA0 spec</b>. I'm splitting it into 4 concepts — we'll secure them one by one:</>}
          </Bubble>
          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
            {["Composite functions", "Chain rule", "Trig chains", "Reverse chain rule"].map((c) => (
              <span key={c} className="chip-todo">{c}</span>
            ))}
          </div>
          <p className="text-center text-[12.5px] text-faint">
            {fr ? "Cours complet ou « concepts clés » — au choix de Max." : "Full course or “key concepts” — Max's choice."}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "2 · Après le cours, Emma vérifie la maîtrise — question 2/5" : "2 · After the course, Emma checks mastery — question 2/5",
      secs: 8,
      scene: (
        <div className="max-w-md mx-auto pt-3 space-y-3">
          <Bubble who="emma" name="Emma">
            <RichText text={"**Given that** \\( y = (3x^2 - 1)^5 \\), **find** \\( \\frac{dy}{dx} \\)."} />
          </Bubble>
          <Bubble who="max" name="Max">
            <span className="font-mono text-[13.5px]">dy/dx = 5(3x² − 1)⁴</span>
          </Bubble>
          <p className="text-center text-[12px] text-faint pt-1">{fr ? "Emma corrige…" : "Emma is marking…"}</p>
        </div>
      ),
    },
    {
      cap: fr ? "La correction ne dit pas juste « faux » : elle note comme l'examinateur" : "The feedback doesn't just say “wrong”: it marks like the examiner",
      secs: 10,
      scene: (
        <div className="max-w-md mx-auto pt-2 space-y-3">
          <div className="flex justify-center"><span className="chip-fragile">{fr ? "presque" : "almost"}</span></div>
          <Bubble who="emma" name="Emma">
            <RichText
              text={fr
                ? "La structure y est — tu aurais le **M1** (method mark) à l'examen. Mais tu perds le **A1** : tu as oublié de multiplier par la dérivée de l'intérieur. **Méprise : dérivée intérieure oubliée.** La bonne réponse : \\( 5(3x^2-1)^4 \\times 6x = 30x(3x^2-1)^4 \\)."
                : "The structure is there — you'd earn the **M1** (method mark) in the exam. But you lose the **A1**: you forgot to multiply by the derivative of the inside. **Misconception: inner derivative forgotten.** Correct answer: \\( 5(3x^2-1)^4 \\times 6x = 30x(3x^2-1)^4 \\)."}
            />
          </Bubble>
          <p className="text-center text-[12.5px] text-muted">
            {fr ? <>Le concept passe en <span className="chip-fragile">fragile</span> — Emma ne lâche pas.</> : <>The concept is now <span className="chip-fragile">fragile</span> — Emma doesn't let go.</>}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "3 · Remédiation ciblée : le concept raté, réexpliqué sous un autre angle" : "3 · Targeted remediation: the missed concept, explained another way",
      secs: 8,
      scene: (
        <div className="max-w-md mx-auto pt-3 space-y-3">
          <Bubble who="emma" name="Emma">
            {fr
              ? <>Pense à des <b>poupées russes</b> 🪆 : tu dérives la poupée extérieure, puis tu multiplies par la dérivée de celle qu'il y a dedans. Extérieur × intérieur, toujours. On re-vérifie ?</>
              : <>Think <b>Russian dolls</b> 🪆: differentiate the outer doll, then multiply by the derivative of the one inside. Outer × inner, always. Shall we re-check?</>}
          </Bubble>
          <Bubble who="max" name="Max"><span className="font-mono text-[13.5px]">30x(3x² − 1)⁴ ✓</span></Bubble>
          <div className="flex justify-center"><span className="chip-acquis">{fr ? "chain rule · acquis" : "chain rule · secure"}</span></div>
        </div>
      ),
    },
    {
      cap: fr ? "4 · Exercice en conditions d'examen — sur papier, photo de la copie" : "4 · Exam-conditions exercise — on paper, photo of the script",
      secs: 8,
      scene: (
        <div className="max-w-md mx-auto pt-2">
          <div className="border border-line rounded-2xl p-4 bg-white">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="chip bg-amber-soft text-amber font-mono">“Show that”</span>
              <span className="chip-todo">4 marks · ~5 min</span>
            </div>
            <p className="text-[13.5px] mt-2 text-ink leading-snug">
              Show that the curve y = (2x − 3)⁴ has a stationary point at x = 3⁄2.
            </p>
            <p className="text-[11.5px] text-muted mt-2 bg-indigo-soft rounded-lg px-3 py-2">
              🎯 <b>{fr ? "Ce que l'examinateur attend :" : "What the examiner expects:"}</b>{" "}
              {fr
                ? "le résultat est donné — tout se joue dans le cheminement écrit, étape par étape, conclusion comprise."
                : "the result is given — everything is in the written working, step by step, conclusion included."}
            </p>
          </div>
          <div className="mt-3 border border-dashed border-line rounded-xl px-3.5 py-2.5 text-[13px] text-mastered bg-mastered-bg/40 text-center">
            📷 {fr ? "Max photographie sa copie manuscrite et l'envoie" : "Max photographs his handwritten script and uploads it"} ✓
          </div>
        </div>
      ),
    },
    {
      cap: fr ? "Emma corrige le manuscrit au mark scheme — mark par mark" : "Emma marks the script against the mark scheme — mark by mark",
      secs: 10,
      scene: (
        <div className="max-w-md mx-auto pt-2 space-y-3">
          <div className="flex items-baseline justify-center gap-2">
            <span style={{ ...serif, fontSize: 40, fontWeight: 600, color: EM }}>3<span style={{ fontSize: 18 }}>/4</span></span>
            <span className="chip-fragile">marks</span>
          </div>
          <div className="max-w-xs mx-auto space-y-1 text-[13px]">
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — chain rule {fr ? "posée" : "set up"}</span></div>
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">A1 — {fr ? "dérivée exacte" : "exact derivative"}</span></div>
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — dy/dx = 0 {fr ? "résolu" : "solved"}</span></div>
            <div className="flex gap-2"><span className="text-gap font-bold">✗</span><span className="text-gap font-semibold">A1 — {fr ? "conclusion non écrite" : "conclusion missing"}</span></div>
          </div>
          <Bubble who="emma" name="Emma">
            {fr
              ? <>Bonne méthode, tu gardes tes M marks — c'est comme ça qu'on note à l'examen. Mais un « Show that » sans phrase finale perd son dernier mark : <b>c'est l'habitude n°7 de celles qui coûtent l'A*</b>. Je te la re-testerai dans 3 jours.</>
              : <>Good method, you keep your M marks — that's how the real exam is marked. But a “Show that” without a final statement loses its last mark: <b>habit #7 of the A*-costing list</b>. I'll re-test you on it in 3 days.</>}
          </Bubble>
        </div>
      ),
    },
    {
      cap: fr ? "5 · Fin de séance — 42 minutes. Tout est tracé sur le tableau de bord" : "5 · End of session — 42 minutes. Everything lands on the dashboard",
      secs: 9,
      scene: (
        <div className="max-w-md mx-auto pt-3">
          <div className="flex items-center justify-center gap-5">
            {([[fr ? "Départ" : "Start", "C", "#9a948a"], [fr ? "Actuel" : "Current", "A", EM], [fr ? "Objectif" : "Target", "A*", "#b58a00"]] as const).map(([l, v, c], k) => (
              <div key={l} className="flex items-center gap-5">
                {k > 0 && <span className="text-faint text-xl">→</span>}
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-faint">{l}</div>
                  <div style={{ ...serif, fontSize: 34, fontWeight: 900, color: c }}>{v}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 max-w-sm mx-auto text-[13px] space-y-1.5">
            <div className="flex justify-between border-b border-line pb-1"><span className="text-muted">{fr ? "Concepts sécurisés aujourd'hui" : "Concepts secured today"}</span><span className="font-bold text-mastered">3 / 4</span></div>
            <div className="flex justify-between border-b border-line pb-1"><span className="text-muted">{fr ? "Point à travailler" : "Point to work on"}</span><span className="font-bold text-learning">{fr ? "Conclusions des « Show that »" : "“Show that” conclusions"}</span></div>
            <div className="flex justify-between"><span className="text-muted">{fr ? "Prochaine re-vérification" : "Next re-check"}</span><span className="font-bold text-indigo">{fr ? "dans 3 jours, automatique" : "in 3 days, automatic"}</span></div>
          </div>
          <p className="text-center text-[12.5px] text-muted mt-3">
            {fr ? "Ses parents voient la même chose : la progression, pas des promesses." : "His parents see the same thing: progress, not promises."}
          </p>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Chapitre 3 · UNE SÉANCE DE COACHING D'EXAMEN (en dialogue)
// ---------------------------------------------------------------------------
function coachingShots(lang: Lang): Shot[] {
  const fr = lang === "fr";
  return [
    {
      cap: fr ? "Une séance de coaching d'examen — pas de contenu ici : le mental, la méthode, le jour J" : "An exam-coaching session — no content here: mindset, method, exam day",
      secs: 6,
      scene: (
        <div className="text-center pt-8">
          <EmmaMark />
          <h3 style={{ ...serif, fontWeight: 900, fontSize: 24, color: EM }} className="mt-4">
            {fr ? "Jeudi. Mock de maths dans 3 jours." : "Thursday. Maths mock in 3 days."}
          </h3>
          <p className="text-muted text-[14.5px] mt-2 max-w-sm mx-auto leading-relaxed">
            {fr
              ? "Emma n'enseigne pas ici. Elle écoute, pose des questions, et prépare le compétiteur."
              : "Emma isn't teaching here. She listens, asks questions, and prepares the competitor."}
          </p>
        </div>
      ),
    },
    {
      cap: fr ? "D'abord, Emma écoute — et valide ce que l'élève ressent" : "First, Emma listens — and validates what the student feels",
      secs: 10,
      scene: (
        <div className="max-w-md mx-auto pt-3 space-y-3">
          <Bubble who="max" name="Max">
            {fr
              ? "Je stresse pour le mock. La dernière fois j'ai paniqué sur une grosse question, j'ai perdu 20 minutes dessus et j'ai bâclé la fin."
              : "I'm stressed about the mock. Last time I panicked on a big question, lost 20 minutes on it and rushed the end."}
          </Bubble>
          <Bubble who="emma" name="Emma">
            {fr
              ? "Ce que tu décris, c'est le piège classique — et ça se corrige très bien. Raconte-moi : à quel moment exactement tu as senti que tu perdais le contrôle ?"
              : "What you're describing is the classic trap — and it's very fixable. Tell me: at what exact moment did you feel you were losing control?"}
          </Bubble>
          <Bubble who="max" name="Max">
            {fr
              ? "Quand j'ai vu que je n'arrivais pas à démarrer la question 9. Je me suis dit que si je la ratais, c'était fichu."
              : "When I couldn't get question 9 started. I told myself that if I failed it, it was all over."}
          </Bubble>
        </div>
      ),
    },
    {
      cap: fr ? "Puis elle donne une stratégie concrète — pas des banalités" : "Then she gives a concrete strategy — not platitudes",
      secs: 12,
      scene: (
        <div className="max-w-md mx-auto pt-2 space-y-3">
          <Bubble who="emma" name="Emma">
            {fr
              ? <>Une question ratée ne fait jamais perdre l'examen — c'est le temps qu'on lui sacrifie qui le fait. On installe 3 réflexes pour dimanche :</>
              : <>One failed question never loses the exam — the time you sacrifice to it does. Let's install 3 reflexes for Sunday:</>}
          </Bubble>
          <div className="max-w-sm mx-auto space-y-1.5 text-[13px]">
            <div className="flex gap-2 items-start"><span className="chip bg-amber-soft text-amber font-mono shrink-0">1</span><span className="text-muted">{fr ? "Règle du temps : ~1 mark = 1 minute. Tu dépasses de 50% → tu marques la question, tu passes." : "Time rule: ~1 mark = 1 minute. 50% over → flag the question, move on."}</span></div>
            <div className="flex gap-2 items-start"><span className="chip bg-amber-soft text-amber font-mono shrink-0">2</span><span className="text-muted">{fr ? "Question bloquée = pas perdue : écris ce que tu sais (méthode = M marks), tu y reviens à la fin." : "A stuck question isn't lost: write what you know (method = M marks), come back at the end."}</span></div>
            <div className="flex gap-2 items-start"><span className="chip bg-amber-soft text-amber font-mono shrink-0">3</span><span className="text-muted">{fr ? "Routine anti-panique : 3 respirations lentes, relire l'énoncé en soulignant les données. 30 secondes qui en sauvent 15 minutes." : "Anti-panic routine: 3 slow breaths, re-read the question underlining the data. 30 seconds that save 15 minutes."}</span></div>
          </div>
        </div>
      ),
    },
    {
      cap: fr ? "Chaque séance repart avec des actions — et Emma s'appuie sur les vraies données de l'élève" : "Every session ends with actions — grounded in the student's real data",
      secs: 10,
      scene: (
        <div className="max-w-md mx-auto pt-2 space-y-3">
          <Bubble who="emma" name="Emma">
            {fr
              ? <>Et rappelle-toi : tes trois dernières séries d'exercices sont à <b>68%, 74%, 79%</b> — la courbe monte. Le niveau y est. D'ici dimanche : un past paper complet en conditions réelles, chrono en main, avec les 3 réflexes. On débriefe lundi ?</>
              : <>And remember: your last three exercise sets scored <b>68%, 74%, 79%</b> — the curve is climbing. The level is there. Before Sunday: one full past paper in real conditions, timer on, using the 3 reflexes. Debrief on Monday?</>}
          </Bubble>
          <Bubble who="max" name="Max">{fr ? "Ok. Ça va mieux là. Merci Emma 💪" : "Ok. Feeling better already. Thanks Emma 💪"}</Bubble>
          <p className="text-center text-[12.5px] text-faint">
            {fr
              ? "Toujours bienveillante, jamais complaisante. Et si un élève exprime un vrai mal-être, Emma l'oriente vers un adulte de confiance."
              : "Always supportive, never complacent. And if a student expresses real distress, Emma directs them to a trusted adult."}
          </p>
        </div>
      ),
    },
  ];
}

function buildShots(lang: Lang, chapter: Chapter): Shot[] {
  if (chapter === "product") return productShots(lang);
  if (chapter === "coaching") return coachingShots(lang);
  return tutoringShots(lang);
}

const UI = {
  fr: {
    demo: "— la démo", replay: "⟲ Revoir", pause: "⏸ Pause", play: "▶ Lecture", next: "Suivant ›", tryNow: "Essayer maintenant",
    chapters: { product: "Le produit", tutoring: "Une séance de tutoring", coaching: "Une séance de coaching" } as Record<Chapter, string>,
  },
  en: {
    demo: "— the demo", replay: "⟲ Replay", pause: "⏸ Pause", play: "▶ Play", next: "Next ›", tryNow: "Try it now",
    chapters: { product: "The product", tutoring: "A tutoring session", coaching: "A coaching session" } as Record<Chapter, string>,
  },
};

const CHAPTERS: Chapter[] = ["product", "tutoring", "coaching"];

export default function DemoStudio({ onClose, fullscreen, lang = "en", initialChapter = "product" }: { onClose?: () => void; fullscreen?: boolean; lang?: Lang; initialChapter?: Chapter }) {
  const [chapter, setChapter] = useState<Chapter>(initialChapter);
  const shots = buildShots(lang, chapter);
  const u = UI[lang] || UI.en;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const shot = shots[Math.min(idx, shots.length - 1)];

  // NARRATION — la voix UK de Coach Emma (clips /demo-audio, anglais).
  // La durée de chaque tableau se cale sur la durée du clip.
  const hasAudio = lang === "en";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [audioDur, setAudioDur] = useState(0);
  const effSecs = Math.max(shot.secs, audioDur > 0 ? audioDur + 0.6 : 0);

  useEffect(() => {
    startRef.current = Date.now();
    setTick(0);
    setAudioDur(0);
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    if (hasAudio) {
      a.src = `/demo-audio/${chapter}-${idx}.mp3`;
      a.currentTime = 0;
      if (playing && soundOn) a.play().catch(() => setSoundOn(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, chapter, hasAudio]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const pct = Math.min(100, (elapsed / effSecs) * 100);
      setTick(pct);
      if (pct >= 100) {
        setIdx((x) => {
          // fin d'un chapitre → on enchaîne sur le suivant
          if (x + 1 < shots.length) return x + 1;
          const nextCh = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
          if (nextCh) {
            setChapter(nextCh);
            return 0;
          }
          return x;
        });
      } else {
        raf.current = requestAnimationFrame(loop);
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, idx, chapter, effSecs, shots.length]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      audioRef.current?.pause();
    } else {
      startRef.current = Date.now() - (tick / 100) * effSecs * 1000;
      setPlaying(true);
      if (hasAudio && soundOn) audioRef.current?.play().catch(() => {});
    }
  };
  const toggleSound = () => {
    const a = audioRef.current;
    if (soundOn) {
      setSoundOn(false);
      a?.pause();
    } else {
      setSoundOn(true);
      if (a && hasAudio && playing) a.play().catch(() => {});
    }
  };
  const pickChapter = (c: Chapter) => {
    setChapter(c);
    setIdx(0);
    setPlaying(true);
  };
  const lastOfAll = chapter === CHAPTERS[CHAPTERS.length - 1] && idx === shots.length - 1;

  const inner = (
    <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden flex flex-col" style={{ boxShadow: "0 40px 90px -30px rgba(6,78,59,.7)" }}>
      {/* Narration : la voix UK de Coach Emma */}
      <audio
        ref={audioRef}
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = (e.target as HTMLAudioElement).duration;
          if (isFinite(d) && d > 0) setAudioDur(d);
        }}
      />
      <div className="relative px-5 py-4" style={{ background: `linear-gradient(150deg,${EM},${EM2})` }}>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 w-8 h-8 rounded-lg text-lg leading-none text-white/80 bg-white/10 hover:bg-white/20">×</button>
        )}
        <div className="flex items-baseline gap-2">
          <span style={{ ...serif, fontWeight: 900, fontSize: 17 }} className="text-white">Coach Emma</span>
          <span style={{ ...serif, fontWeight: 900, fontSize: 17, color: GOLD }}>Student</span>
          <span className="text-[11px] text-white/60 ml-1">{u.demo}</span>
        </div>
        {/* Les 3 démos */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {CHAPTERS.map((c) => (
            <button
              key={c}
              onClick={() => pickChapter(c)}
              className="rounded-full px-3 py-1 text-[11.5px] font-bold cursor-pointer"
              style={
                chapter === c
                  ? { background: GOLD, color: EM, border: "none" }
                  : { background: "rgba(255,255,255,.12)", color: "#d7eadf", border: "none" }
              }
            >
              {u.chapters[c]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 mt-3">
          {shots.map((_, k) => (
            <span key={k} className="h-1 flex-1 rounded-full overflow-hidden bg-white/20">
              <span
                className="block h-full rounded-full"
                style={{ width: k < idx ? "100%" : k === idx ? `${tick}%` : "0%", background: GOLD, transition: k === idx ? "none" : "width .3s" }}
              />
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 text-center">
        <p className="text-[12px] font-bold uppercase tracking-wider text-amber leading-snug min-h-[32px]">{shot.cap}</p>
      </div>

      <div className="px-5 pb-4 pt-1" style={{ minHeight: 320 }}>
        <div key={`${chapter}-${idx}`} style={{ animation: "dsin .45s ease" }}>{shot.scene}</div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-line">
        <div className="flex gap-2">
          {hasAudio && (
            <button onClick={toggleSound} title={soundOn ? "Mute Emma's voice" : "Unmute Emma's voice"} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">
              {soundOn ? "🔊" : "🔇"}
            </button>
          )}
          <button onClick={() => { setIdx(0); setPlaying(true); }} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{u.replay}</button>
          {!lastOfAll && <button onClick={togglePlay} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{playing ? u.pause : u.play}</button>}
          {!lastOfAll && (
            <button
              onClick={() => {
                if (idx + 1 < shots.length) setIdx(idx + 1);
                else {
                  const nextCh = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
                  if (nextCh) pickChapter(nextCh);
                }
              }}
              className="btn-ghost !py-1.5 !px-3 text-[12.5px]"
            >
              {u.next}
            </button>
          )}
        </div>
        <Link href="/login?register=1" className="btn-amber !py-1.5 !px-4 text-[13px]">{u.tryNow}</Link>
      </div>
      <style>{`@keyframes dsin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );

  if (fullscreen) {
    return <div className="min-h-[70vh] flex items-center justify-center py-6">{inner}</div>;
  }
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4,32,24,.55)", backdropFilter: "blur(3px)", animation: "dsin .2s ease" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center max-h-[92vh] overflow-y-auto">{inner}</div>
    </div>
  );
}
