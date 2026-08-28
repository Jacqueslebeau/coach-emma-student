"use client";

// « Voir la démo » — démo scénarisée ~2 min (mécanique Coach Emma) : une vraie
// séance de Max, tableau par tableau, auto-avancée avec légendes. Sans audio
// (Phase 0) : le rythme est porté par le minuteur + la barre de progression.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";

const IND = "#4F46E5";
const DEEP = "#2A2472";
const AMB = "#EBA92C";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;

type Shot = { cap: string; secs: number; scene: React.ReactNode };

function EmmaMark() {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: DEEP, border: `3px solid ${AMB}` }}>
        <span style={{ ...serif, color: "#FBFAFF", fontSize: 26, fontWeight: 900 }}>E</span>
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
            ? "bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[88%] text-[14px]"
            : "bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[92%] text-[14px] text-ink"
        }
      >
        {children}
      </div>
    </div>
  );
}

const SHOTS: Shot[] = [
  {
    cap: "Coach Emma Student en 2 minutes — une vraie séance de Max",
    secs: 5,
    scene: (
      <div className="text-center pt-8">
        <EmmaMark />
        <h3 style={{ ...serif, fontWeight: 900, fontSize: 24, color: DEEP }} className="mt-4">
          Mardi, 18h04.
        </h3>
        <p className="text-muted text-[14.5px] mt-2 max-w-sm mx-auto leading-relaxed">
          Max a vu la <b>chain rule</b> en classe aujourd'hui. Voici sa séance avec Emma —
          exactement comme dans l'outil.
        </p>
      </div>
    ),
  },
  {
    cap: "1 · Il capture sa leçon : le titre, ses notes, ou une photo du cours",
    secs: 6,
    scene: (
      <div className="max-w-sm mx-auto pt-2">
        <div className="border border-line rounded-2xl p-5 bg-white">
          <div className="text-[11px] font-bold text-faint">TITRE DE LA LEÇON</div>
          <div className="mt-1 border border-indigo rounded-xl px-3.5 py-2.5 text-[14px]" style={{ color: DEEP }}>
            Differentiation — chain rule
          </div>
          <div className="text-[11px] font-bold text-faint mt-4">PHOTO DU COURS</div>
          <div className="mt-1 border border-dashed border-line rounded-xl px-3.5 py-3 text-[13px] text-mastered bg-mastered-bg/40">
            📷 IMG_2841.jpg — la page de son cahier ✓
          </div>
          <div className="mt-5 rounded-xl text-center font-bold text-white py-2.5 text-[14px]" style={{ background: IND }}>
            C'est parti →
          </div>
        </div>
      </div>
    ),
  },
  {
    cap: "Emma lit son cours et identifie les concepts du programme Edexcel",
    secs: 6,
    scene: (
      <div className="max-w-md mx-auto pt-3 space-y-3">
        <Bubble who="emma">
          C'est la leçon <b>Pure 7.2 du spec Edexcel 9MA0</b>. Je la découpe en 4 concepts — on
          va les sécuriser un par un :
        </Bubble>
        <div className="flex flex-wrap gap-1.5 justify-center pt-1">
          {["Reconnaître une fonction composée", "Chain rule", "Fonctions trig composées", "Chain rule inversée"].map((c) => (
            <span key={c} className="chip-todo">{c}</span>
          ))}
        </div>
        <p className="text-center text-[12.5px] text-faint">Cours complet ou « concepts clés » — au choix de Max.</p>
      </div>
    ),
  },
  {
    cap: "2 · Après le cours, Emma vérifie la maîtrise — question 2/5",
    secs: 8,
    scene: (
      <div className="max-w-md mx-auto pt-3 space-y-3">
        <Bubble who="emma">
          <RichText text={"**Given that** \\( y = (3x^2 - 1)^5 \\), **find** \\( \\frac{dy}{dx} \\)."} />
        </Bubble>
        <Bubble who="max">
          <span className="font-mono text-[13.5px]">dy/dx = 5(3x² − 1)⁴</span>
        </Bubble>
        <p className="text-center text-[12px] text-faint pt-1">Emma corrige…</p>
      </div>
    ),
  },
  {
    cap: "La correction ne dit pas juste « faux » : elle note comme l'examinateur",
    secs: 10,
    scene: (
      <div className="max-w-md mx-auto pt-2 space-y-3">
        <div className="flex justify-center"><span className="chip-fragile">presque</span></div>
        <Bubble who="emma">
          <RichText
            text={"La structure y est — tu aurais le **M1** (method mark) à l'examen. Mais tu perds le **A1** : tu as oublié de multiplier par la dérivée de l'intérieur. **Méprise : dérivée intérieure oubliée.** La bonne réponse : \\( 5(3x^2-1)^4 \\times 6x = 30x(3x^2-1)^4 \\)."}
          />
        </Bubble>
        <p className="text-center text-[12.5px] text-muted">
          Le concept passe en <span className="chip-fragile">fragile</span> — Emma ne lâche pas.
        </p>
      </div>
    ),
  },
  {
    cap: "3 · Remédiation ciblée : le concept raté, réexpliqué sous un autre angle",
    secs: 8,
    scene: (
      <div className="max-w-md mx-auto pt-3 space-y-3">
        <Bubble who="emma">
          Pense à des <b>poupées russes</b> 🪆 : tu dérives la poupée extérieure, puis tu
          multiplies par la dérivée de celle qu'il y a dedans. Extérieur × intérieur, toujours.
          On re-vérifie ?
        </Bubble>
        <Bubble who="max"><span className="font-mono text-[13.5px]">30x(3x² − 1)⁴ ✓</span></Bubble>
        <div className="flex justify-center"><span className="chip-acquis">chain rule · acquis</span></div>
      </div>
    ),
  },
  {
    cap: "4 · Exercice en conditions d'examen — sur papier, photo de la copie",
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
            🎯 <b>Ce que l'examinateur attend :</b> le résultat est donné — tout se joue dans le
            cheminement écrit, étape par étape, conclusion comprise.
          </p>
        </div>
        <div className="mt-3 border border-dashed border-line rounded-xl px-3.5 py-2.5 text-[13px] text-mastered bg-mastered-bg/40 text-center">
          📷 Max photographie sa copie manuscrite et l'envoie ✓
        </div>
      </div>
    ),
  },
  {
    cap: "Emma corrige le manuscrit au mark scheme — mark par mark",
    secs: 10,
    scene: (
      <div className="max-w-md mx-auto pt-2 space-y-3">
        <div className="flex items-baseline justify-center gap-2">
          <span style={{ ...serif, fontSize: 40, fontWeight: 600, color: IND }}>3<span style={{ fontSize: 18 }}>/4</span></span>
          <span className="chip-fragile">marks</span>
        </div>
        <div className="max-w-xs mx-auto space-y-1 text-[13px]">
          <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — chain rule posée</span></div>
          <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">A1 — dérivée exacte</span></div>
          <div className="flex gap-2"><span className="text-mastered font-bold">✓</span><span className="text-muted">M1 — dy/dx = 0 résolu</span></div>
          <div className="flex gap-2"><span className="text-gap font-bold">✗</span><span className="text-gap font-semibold">A1 — conclusion non écrite</span></div>
        </div>
        <Bubble who="emma">
          Bonne méthode, tu gardes tes M marks — c'est comme ça qu'on note à l'examen. Mais un
          « Show that » sans phrase finale perd son dernier mark : <b>c'est l'habitude n°7 de
          celles qui coûtent l'A*</b>. Je te la re-testerai dans 3 jours.
        </Bubble>
      </div>
    ),
  },
  {
    cap: "5 · Fin de séance — 42 minutes. Tout est tracé sur le tableau de bord",
    secs: 9,
    scene: (
      <div className="max-w-md mx-auto pt-3">
        <div className="flex items-center justify-center gap-5">
          {([["Départ", "C", "#8886a6"], ["Actuel", "A", IND], ["Objectif", "A*", AMB]] as const).map(([l, v, c], k) => (
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
          <div className="flex justify-between border-b border-line pb-1"><span className="text-muted">Concepts sécurisés aujourd'hui</span><span className="font-bold text-mastered">3 / 4</span></div>
          <div className="flex justify-between border-b border-line pb-1"><span className="text-muted">Point à travailler</span><span className="font-bold text-learning">Conclusions des « Show that »</span></div>
          <div className="flex justify-between"><span className="text-muted">Prochaine re-vérification</span><span className="font-bold text-indigo">dans 3 jours, automatique</span></div>
        </div>
        <p className="text-center text-[12.5px] text-muted mt-3">Ses parents voient la même chose : la progression, pas des promesses.</p>
      </div>
    ),
  },
  {
    cap: "Séance après séance, la courbe monte — jusqu'à l'A*",
    secs: 7,
    scene: (
      <div className="text-center pt-6">
        <EmmaMark />
        <h3 style={{ ...serif, fontWeight: 900, fontSize: 26, color: DEEP }} className="mt-4">
          Prêt à viser l'<span style={{ color: AMB }}>A*</span> ?
        </h3>
        <p className="text-muted text-[14px] mt-2 max-w-sm mx-auto">
          Maths Edexcel disponible aujourd'hui. Économie et Géographie arrivent.
        </p>
        <div className="flex justify-center gap-3 mt-5">
          <Link href="/login?register=1" className="btn-amber !px-6 !py-2.5 font-bold">Commencer</Link>
          <Link href="/login" className="btn-ghost !px-6 !py-2.5">Se connecter</Link>
        </div>
      </div>
    ),
  },
];

export default function DemoStudio({ onClose, fullscreen }: { onClose?: () => void; fullscreen?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0); // progression du plan courant (0-100)
  const raf = useRef<number>(0);
  const startRef = useRef<number>(Date.now());
  const shot = SHOTS[idx];

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
        setIdx((x) => Math.min(x + 1, SHOTS.length - 1));
      } else {
        raf.current = requestAnimationFrame(loop);
      }
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, idx, shot.secs]);

  // pause → mémorise le temps écoulé pour reprendre proprement
  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      startRef.current = Date.now() - (tick / 100) * shot.secs * 1000;
      setPlaying(true);
    }
  };
  const last = idx === SHOTS.length - 1;

  const inner = (
    <div className="w-full max-w-xl bg-white rounded-3xl overflow-hidden flex flex-col" style={{ boxShadow: "0 40px 90px -30px rgba(42,36,114,.7)" }}>
      {/* Bandeau marque */}
      <div className="relative px-5 py-4" style={{ background: `linear-gradient(150deg, #3F38C4, ${DEEP})` }}>
        {onClose && (
          <button onClick={onClose} aria-label="Fermer" className="absolute top-3 right-3 w-8 h-8 rounded-lg text-lg leading-none text-white/80 bg-white/10 hover:bg-white/20">×</button>
        )}
        <div className="flex items-baseline gap-2">
          <span style={{ ...serif, fontWeight: 900, fontSize: 17 }} className="text-white">Coach Emma</span>
          <span style={{ ...serif, fontWeight: 900, fontSize: 17, color: "#F3CE82" }}>Student</span>
          <span className="text-[11px] text-white/60 ml-1">— la démo</span>
        </div>
        {/* Barre de progression globale (par plans) */}
        <div className="flex gap-1 mt-3">
          {SHOTS.map((_, k) => (
            <span key={k} className="h-1 flex-1 rounded-full overflow-hidden bg-white/20">
              <span
                className="block h-full rounded-full"
                style={{ width: k < idx ? "100%" : k === idx ? `${tick}%` : "0%", background: "#F3CE82", transition: k === idx ? "none" : "width .3s" }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="px-5 pt-4 text-center">
        <p className="text-[12px] font-bold uppercase tracking-wider text-amber leading-snug min-h-[32px]">{shot.cap}</p>
      </div>

      {/* Scène */}
      <div className="px-5 pb-4 pt-1" style={{ minHeight: 320 }}>
        <div key={idx} style={{ animation: "dsin .45s ease" }}>{shot.scene}</div>
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-line">
        <div className="flex gap-2">
          <button onClick={() => { setIdx(0); setPlaying(true); }} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">⟲ Revoir</button>
          {!last && (
            <button onClick={togglePlay} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">{playing ? "⏸ Pause" : "▶ Lecture"}</button>
          )}
          {!last && (
            <button onClick={() => setIdx((x) => Math.min(x + 1, SHOTS.length - 1))} className="btn-ghost !py-1.5 !px-3 text-[12.5px]">Suivant ›</button>
          )}
        </div>
        <Link href="/login?register=1" className="btn-primary !py-1.5 !px-4 text-[13px]">Essayer maintenant</Link>
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
      style={{ background: "rgba(15,14,42,.55)", backdropFilter: "blur(3px)", animation: "dsin .2s ease" }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center max-h-[92vh] overflow-y-auto">{inner}</div>
    </div>
  );
}
