"use client";

// « Voir la démo » — démo scénarisée ~2 min (mécanique Coach Emma) : une vraie
// séance de Max, tableau par tableau, auto-avancée avec légendes. Bilingue
// FR/EN. Code couleur Coach Emma. (La narration voix arrivera avec la clé
// ElevenLabs — même principe que les clips d_*.mp3 d'Emma.)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import type { Lang } from "@/lib/i18n";

const EM = "#064E3B";
const EM2 = "#0c6a4e";
const GOLD = "#FACC15";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;

type Shot = { cap: string; secs: number; scene: React.ReactNode };

function EmmaMark() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: EM, border: `3px solid ${GOLD}` }}>
        <span style={{ ...serif, color: "#FAF8F3", fontSize: 26, fontWeight: 900 }}>E</span>
      </span>
    </div>
  );
}

function Bubble({ who, children }: { who: "emma" | "max"; children: React.ReactNode }) {
  return (
    <div className={who === "max" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          who === "max"
            ? "text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[88%] text-[14px]"
            : "bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[92%] text-[14px] text-ink"
        }
        style={who === "max" ? { background: EM2 } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function buildShots(lang: Lang): Shot[] {
  const fr = lang === "fr";
  return [
    {
      cap: fr ? "Coach Emma Student en 2 minutes — une vraie séance de Max" : "Coach Emma Student in 2 minutes — one of Max's real sessions",
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
          <Bubble who="emma">
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
          <Bubble who="emma">
            <RichText text={"**Given that** \\( y = (3x^2 - 1)^5 \\), **find** \\( \\frac{dy}{dx} \\)."} />
          </Bubble>
          <Bubble who="max">
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
          <Bubble who="emma">
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
          <Bubble who="emma">
            {fr
              ? <>Pense à des <b>poupées russes</b> 🪆 : tu dérives la poupée extérieure, puis tu multiplies par la dérivée de celle qu'il y a dedans. Extérieur × intérieur, toujours. On re-vérifie ?</>
              : <>Think <b>Russian dolls</b> 🪆: differentiate the outer doll, then multiply by the derivative of the one inside. Outer × inner, always. Shall we re-check?</>}
          </Bubble>
          <Bubble who="max"><span className="font-mono text-[13.5px]">30x(3x² − 1)⁴ ✓</span></Bubble>
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
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — chain rule {lang === "fr" ? "posée" : "set up"}</span></div>
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">A1 — {lang === "fr" ? "dérivée exacte" : "exact derivative"}</span></div>
            <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — dy/dx = 0 {lang === "fr" ? "résolu" : "solved"}</span></div>
            <div className="flex gap-2"><span className="text-gap font-bold">✗</span><span className="text-gap font-semibold">A1 — {lang === "fr" ? "conclusion non écrite" : "conclusion missing"}</span></div>
          </div>
          <Bubble who="emma">
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
    {
      cap: fr ? "Séance après séance, la courbe monte — jusqu'à l'A*" : "Session after session, the curve climbs — all the way to the A*",
      secs: 7,
      scene: (
        <div className="text-center pt-6">
          <EmmaMark />
          <h3 style={{ ...serif, fontWeight: 900, fontSize: 26, color: EM }} className="mt-4">
            {fr ? "Prêt à viser l'" : "Ready to aim for the "}<span style={{ color: "#b58a00" }}>A*</span> ?
          </h3>
          <p className="text-muted text-[14px] mt-2 max-w-sm mx-auto">
            {fr
              ? "Maths, Économie, Géographie — et le Français A Level en candidat libre."
              : "Maths, Economics, Geography — and A Level French as a private candidate."}
          </p>
          <div className="flex justify-center gap-3 mt-5">
            <Link href="/login?register=1" className="btn-amber !px-6 !py-2.5">{fr ? "Commencer" : "Start"}</Link>
            <Link href="/login" className="btn-ghost !px-6 !py-2.5">{fr ? "Se connecter" : "Sign in"}</Link>
          </div>
        </div>
      ),
    },
  ];
}

const UI = {
  fr: { demo: "— la démo", replay: "⟲ Revoir", pause: "⏸ Pause", play: "▶ Lecture", next: "Suivant ›", tryNow: "Essayer maintenant" },
  en: { demo: "— the demo", replay: "⟲ Replay", pause: "⏸ Pause", play: "▶ Play", next: "Next ›", tryNow: "Try it now" },
};

export default function DemoStudio({ onClose, fullscreen, lang = "fr" }: { onClose?: () => void; fullscreen?: boolean; lang?: Lang }) {
  const shots = buildShots(lang);
  const u = UI[lang] || UI.fr;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const shot = shots[idx];

  useEffect(() => {
    startRef.current = Date.now();
    setTick(0);
  }, [idx]);

  useEffect(() => {
    if (!playing) return;
    const loop = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const pct = Math.min(100, (elapsed / shot.secs) * 100);
      setTick(pct);
      if (pct >= 100) {
        setIdx((x) => Math.min(x + 1, shots.length - 1));
      } else {
        raf.current = requestAnimationFrame(loop);
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, idx, shot.secs, shots.length]);

  const togglePlay = () => {
    if (playing) setPlaying(false);
    else {
      startRef.current = Date.now() - (tick / 100) * shot.secs * 1000;
      setPlaying(true);
    }
  };
  const last = idx === shots.length - 1;

  const inner = (
    <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden flex flex-col" style={{ boxShadow: "0 40px 90px -30px rgba(6,78,59,.7)" }}>
      <div className="relative px-5 py-4" style={{ background: `linear-gradient(150deg,${EM},${EM2})` }}>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 w-8 h-8 rounded-lg text-lg leading-none text-white/80 bg-white/10 hover:bg-white/20">×</button>
        )}
        <div className="flex items-baseline gap-2">
          <span style={{ ...serif, fontWeight: 900, fontSize: 17 }} className="text-white">Coach Emma</span>
          <span style={{ ...serif, fontWeight: 900, fontSize: 17, color: GOLD }}>Student</span>
          <span className="text-[11px] text-white/60 ml-1">{u.demo}</span>
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
        <div key={idx} style={{ animation: "dsin .45s ease" }}>{shot.scene}</div>
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-line">
        <div className="flex gap-2">
          <button onClick={() => { setIdx(0); setPlaying(true); }} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{u.replay}</button>
          {!last && <button onClick={togglePlay} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{playing ? u.pause : u.play}</button>}
          {!last && <button onClick={() => setIdx((x) => Math.min(x + 1, shots.length - 1))} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{u.next}</button>}
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
