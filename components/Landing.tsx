"use client";

// Site vitrine — même architecture que Coach Emma : hero avec halo + démo
// animée (HeroDemo), CTA doré « Commencer » (effet brillance), « ▶ Voir la
// démo » (DemoStudio scénarisé), bandeau preuve, Comment ça marche, Pour qui.
// Identité Coach Emma Student : indigo / ambre / A★.
import { useState } from "react";
import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import DemoStudio from "@/components/DemoStudio";

const IND = "#4F46E5";
const DEEP = "#2A2472";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;
const GOLD_GRAD = "linear-gradient(180deg,#F5C155,#EBA92C)";
const GLOW_CTA = "0 14px 34px -10px rgba(235,169,44,.72)";
const CARD_GLOW = "0 26px 58px -40px rgba(42,36,114,.5)";

const STATS: [string, string][] = [
  ["45 min", "la séance efficace, cadrée par Emma"],
  ["100%", "ancré sur les specs Edexcel / OCR"],
  ["M + A", "noté mark par mark, comme l'examinateur"],
  ["A★", "l'objectif — et la courbe qui le prouve"],
];

const STEPS: string[] = [
  "Il capture sa leçon du jour — le titre, ses notes, ou une photo du cours pris en classe.",
  "Emma écrit le cours : complet ou « concepts clés », ancré sur le spec de l'exam board.",
  "Elle vérifie la maîtrise concept par concept — et réexplique autrement ce qui coince, jusqu'à ce que ce soit acquis.",
  "Il pratique en conditions d'examen : exercices style past paper, en ligne ou sur papier + photo de la copie.",
  "Correction d'examinateur : mark par mark, méthode valorisée, méprises nommées — on refait tant que ce n'est pas solide.",
  "Rien n'est oublié : les points fragiles reviennent automatiquement, et la progression s'affiche — départ → actuel → A★.",
];

const WHO: { ic: string; t: string; d: string }[] = [
  { ic: "🎓", t: "L'élève qui vise A/A*", d: "GCSE ou A Level, il a le niveau mais veut sécuriser les derniers marks : technique d'examen, pratique constante, points faibles traqués un par un." },
  { ic: "📈", t: "L'élève qui veut monter", d: "De C vers A, de B vers A* : le diagnostic par concept trouve exactement où ça coince, et la boucle ne le lâche pas tant que ce n'est pas acquis." },
  { ic: "👨‍👩‍👧", t: "Les parents", d: "Un tuteur exigeant disponible tous les soirs, une fraction du prix d'un tuteur particulier — et la progression visible séance par séance." },
];

export default function Landing() {
  const [demo, setDemo] = useState(false);

  return (
    <main className="-mx-5 -mt-8" style={{ color: "#191830" }}>
      {/* ============ HERO + HALO ============ */}
      <div className="relative overflow-hidden">
        <div className="hero-aura" aria-hidden="true" />
        <section className="hero-grid relative z-10 max-w-5xl mx-auto px-5 pt-12 pb-14 grid gap-9 items-center" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
          <div>
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-amber">
              Tuteur personnel · GCSE & A Level · UK
            </div>
            <h1 style={{ ...serif, fontWeight: 900, color: DEEP, fontSize: "clamp(27px, 3.2vw, 40px)", lineHeight: 1.06 }} className="mt-3">
              Le tuteur qui ne lâche rien avant le <em className="not-italic" style={{ color: "#C97E10" }}>A*</em>
            </h1>
            <p className="text-[16px] text-muted leading-relaxed mt-4 max-w-md">
              Coach Emma Student prend la leçon du jour, vérifie qu'elle est <b className="text-ink">comprise</b>,
              fait pratiquer en conditions d'examen, corrige comme un examinateur — et retravaille
              ce qui cloche jusqu'à ce que ça tienne.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: DEEP, padding: "15px 28px", boxShadow: GLOW_CTA }}>
                Commencer
              </Link>
              <button onClick={() => setDemo(true)} className="inline-flex items-center gap-2.5 font-bold rounded-2xl cursor-pointer bg-transparent" style={{ border: `1.5px solid ${IND}`, color: IND, padding: "13px 20px" }}>
                <span className="inline-flex items-center justify-center rounded-full text-white" style={{ width: 22, height: 22, background: IND, fontSize: 10, paddingLeft: 2 }}>▶</span>
                Voir la démo
              </button>
              <Link href="/login" className="font-bold underline underline-offset-4 py-3 px-1" style={{ color: IND }}>
                Se connecter
              </Link>
            </div>
          </div>
          <HeroDemo />
        </section>
      </div>

      {/* ============ BANDEAU PREUVE ============ */}
      <div className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, #221d63, ${IND} 85%)` }}>
        <div className="stats-aura" aria-hidden="true" />
        <div className="stats-grid relative z-10 max-w-5xl mx-auto px-5 py-7 grid grid-cols-4 gap-5 text-center">
          {STATS.map(([n, l]) => (
            <div key={n}>
              <div style={{ ...serif, fontWeight: 800, fontSize: 30, color: "#F3CE82", textShadow: "0 0 18px rgba(243,206,130,.5)" }}>{n}</div>
              <div className="text-[12px] mt-1" style={{ color: "#c9c6ee" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section className="max-w-5xl mx-auto px-5 pt-12 pb-12">
        <h2 style={{ ...serif, fontWeight: 600, color: DEEP, fontSize: 30 }} className="text-center">
          Comment ça marche
        </h2>
        <div className="cards-grid grid grid-cols-2 gap-3 mt-7">
          {STEPS.map((s, idx, arr) => {
            const last = idx === arr.length - 1;
            return (
              <div
                key={idx}
                className="flex gap-3 items-start rounded-2xl p-4.5"
                style={{
                  padding: 18,
                  background: last ? `linear-gradient(150deg, #221d63, ${IND})` : "#fff",
                  border: last ? "none" : "1px solid #E1E0EF",
                  boxShadow: CARD_GLOW,
                }}
              >
                <span
                  className="inline-flex items-center justify-center flex-none rounded-lg font-extrabold"
                  style={{ ...serif, fontSize: 15, color: DEEP, background: GOLD_GRAD, width: 30, height: 30, boxShadow: "0 6px 16px -6px rgba(235,169,44,.7)" }}
                >
                  {idx + 1}
                </span>
                <span className="text-[14px] leading-snug self-center" style={{ color: last ? "#e9e8fb" : "#4a4870" }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <button onClick={() => setDemo(true)} className="btn-ghost !px-6">▶ Voir la démo d'une séance</button>
        </div>
      </section>

      {/* ============ POUR QUI ============ */}
      <section className="bg-white border-y border-line">
        <div className="max-w-5xl mx-auto px-5 py-12">
          <h2 style={{ ...serif, fontWeight: 600, color: DEEP, fontSize: 30 }} className="text-center">
            Pour qui ?
          </h2>
          <div className="cards-grid3 grid grid-cols-3 gap-4 mt-7">
            {WHO.map((p) => (
              <div key={p.t} className="lift rounded-2xl p-5 bg-paper border border-line" style={{ boxShadow: CARD_GLOW }}>
                <div className="w-11 h-11 rounded-xl bg-indigo-soft flex items-center justify-center text-xl">{p.ic}</div>
                <div className="font-bold text-[16px] mt-3" style={{ color: DEEP }}>{p.t}</div>
                <p className="text-[13.5px] text-muted leading-relaxed mt-1.5">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-7">
            <Link href="/login?register=1" className="cta-glow relative overflow-hidden inline-block font-extrabold rounded-2xl no-underline text-[14px]" style={{ background: GOLD_GRAD, color: DEEP, padding: "13px 28px", boxShadow: GLOW_CTA }}>
              Commencer
            </Link>
          </div>
        </div>
      </section>

      {/* ============ MATIÈRES ============ */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <h2 style={{ ...serif, fontWeight: 600, color: DEEP, fontSize: 30 }} className="text-center">Les matières</h2>
        <div className="cards-grid3 grid grid-cols-3 gap-4 mt-7">
          <div className="rounded-2xl p-5 bg-white border border-line" style={{ boxShadow: CARD_GLOW }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: DEEP }}>Mathématiques</h3>
              <span className="chip-acquis">disponible</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">Edexcel A Level (9MA0)</p>
            <p className="text-[13.5px] text-muted mt-2.5 leading-relaxed">Cours, notation propre, exercices past-paper, correction des copies photographiées.</p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-line opacity-75" style={{ boxShadow: CARD_GLOW }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: DEEP }}>Économie</h3>
              <span className="chip bg-amber-soft text-amber">bientôt</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">Edexcel A Level</p>
            <p className="text-[13.5px] text-muted mt-2.5 leading-relaxed">Dissertation, structure d'argumentation, technique des questions à points.</p>
          </div>
          <div className="rounded-2xl p-5 bg-white border border-line opacity-75" style={{ boxShadow: CARD_GLOW }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: DEEP }}>Géographie</h3>
              <span className="chip bg-amber-soft text-amber">bientôt</span>
            </div>
            <p className="font-mono text-[11px] text-faint mt-1">OCR A Level</p>
            <p className="text-[13.5px] text-muted mt-2.5 leading-relaxed">Mots-consignes (« assess », « evaluate »), études de cas, réponses en contexte.</p>
          </div>
        </div>
        <p className="text-[13px] text-faint text-center mt-4">D'autres matières et exam boards suivront — la méthode est la même.</p>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="max-w-3xl mx-auto px-5 pb-14 text-center">
        <div className="rounded-3xl bg-white border border-line p-10" style={{ boxShadow: CARD_GLOW }}>
          <h2 style={{ ...serif, fontWeight: 900, color: DEEP, fontSize: 28, lineHeight: 1.2 }}>
            Un ami qui sait tout dans la matière.<br />Et qui veut vraiment ton <span style={{ color: "#C97E10" }}>A*</span>.
          </h2>
          <div className="flex justify-center gap-3 mt-6">
            <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: DEEP, padding: "14px 30px", boxShadow: GLOW_CTA }}>
              Créer un compte
            </Link>
            <button onClick={() => setDemo(true)} className="btn-ghost !px-7 !py-3.5">▶ Voir la démo</button>
          </div>
          <p className="text-xs text-faint mt-5">Accès en beta privée pendant la phase de test.</p>
        </div>
      </section>

      {demo && <DemoStudio onClose={() => setDemo(false)} />}

      <style>{`
        @media(max-width:760px){.hero-grid{grid-template-columns:1fr!important}.cards-grid{grid-template-columns:1fr!important}.cards-grid3{grid-template-columns:1fr!important}.stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:18px!important}}
        .cta-glow{transition:transform .15s, box-shadow .15s}
        .cta-glow:hover{transform:translateY(-2px)}
        .cta-glow::after{content:'';position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);animation:shine 3.6s ease-in-out infinite}
        @keyframes shine{0%{left:-60%}55%,100%{left:130%}}
        .hero-aura{position:absolute;inset:0;pointer-events:none;z-index:0}
        .hero-aura::before{content:'';position:absolute;top:-140px;left:-90px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,.20),transparent 66%)}
        .hero-aura::after{content:'';position:absolute;top:-10px;right:-60px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(235,169,44,.26),transparent 62%);animation:floataura 9s ease-in-out infinite}
        @keyframes floataura{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        .stats-aura{position:absolute;top:-70px;left:28%;width:420px;height:320px;background:radial-gradient(circle,rgba(243,206,130,.20),transparent 60%);pointer-events:none}
        .lift{transition:transform .18s, box-shadow .18s}
        .lift:hover{transform:translateY(-4px)}
        @media(prefers-reduced-motion:reduce){.cta-glow::after,.hero-aura::after{animation:none}}
      `}</style>
    </main>
  );
}
