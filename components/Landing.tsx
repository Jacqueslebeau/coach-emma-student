"use client";

// Site vitrine — STRUCTURE, DESIGN, LAYOUT ET CODE COULEUR de Coach Emma :
// crème #FAF8F3, émeraude #064E3B, or #FACC15, Fraunces ; hero + halo, démo
// animée (HeroDemo), CTA or « Commencer » (effet brillance), « ▶ Voir la
// démo » (DemoStudio scénarisé), bandeau preuve émeraude, Comment ça marche,
// Pour qui, matières. Bilingue FR/EN.
import { useState } from "react";
import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import DemoStudio from "@/components/DemoStudio";
import { useLang, LangToggle } from "@/lib/i18n";

const EM = "#064E3B";
const EM2 = "#0c6a4e";
const GOLD = "#FACC15";
const CREAM = "#FAF8F3";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;
const GOLD_GRAD = "linear-gradient(180deg,#FFDD57,#FACC15)";
const GLOW_CTA = "0 14px 34px -10px rgba(250,204,21,.72)";
const CARD_GLOW = "0 26px 58px -40px rgba(6,78,59,.5)";

const L = {
  fr: {
    tag: "Tuteur personnel · GCSE & A Level · UK",
    h1a: "Le tuteur qui ne lâche rien\navant le ",
    sub: "Coach Emma Student prend la leçon du jour, vérifie qu'elle est comprise, fait pratiquer en conditions d'examen, corrige comme un examinateur — et retravaille ce qui cloche jusqu'à ce que ça tienne.",
    ctaStart: "Commencer", ctaDemo: "Voir la démo", ctaLogin: "Se connecter",
    stats: [
      ["45 min", "la séance efficace, cadrée par Emma"],
      ["4", "matières · Maths · Éco · Géo · Français"],
      ["M + A", "noté mark par mark, comme l'examinateur"],
      ["A★", "l'objectif — et la courbe qui le prouve"],
    ] as [string, string][],
    howTitle: "Comment ça marche",
    steps: [
      "Il capture sa leçon du jour — le titre, ses notes, ou une photo du cours pris en classe.",
      "Emma écrit le cours : complet ou « concepts clés », ancré sur le spec de l'exam board.",
      "Elle vérifie la maîtrise concept par concept — et réexplique autrement ce qui coince, jusqu'à ce que ce soit acquis.",
      "Il pratique en conditions d'examen : exercices style past paper, en ligne ou sur papier + photo de la copie.",
      "Correction d'examinateur : mark par mark, méthode valorisée, méprises nommées — on refait tant que ce n'est pas solide.",
      "Rien n'est oublié : les points fragiles reviennent automatiquement, et la progression s'affiche — départ → actuel → A★.",
    ],
    seeDemo: "▶ Voir la démo d'une séance",
    whoTitle: "Pour qui ?",
    who: [
      { ic: "🎓", t: "L'élève qui vise A/A*", d: "GCSE ou A Level, il a le niveau mais veut sécuriser les derniers marks : technique d'examen, pratique constante, points faibles traqués un par un." },
      { ic: "📈", t: "L'élève qui veut monter", d: "De C vers A, de B vers A* : le diagnostic par concept trouve exactement où ça coince, et la boucle ne le lâche pas tant que ce n'est pas acquis." },
      { ic: "👨‍👩‍👧", t: "Les parents", d: "Un tuteur exigeant disponible tous les soirs, une fraction du prix d'un tuteur particulier — et la progression visible séance par séance." },
    ],
    subjTitle: "Les matières",
    subjects: [
      { t: "Mathématiques", b: "Edexcel A Level (9MA0)", d: "Cours, notation propre, exercices past-paper, correction des copies photographiées.", tag: "disponible" },
      { t: "Économie", b: "Edexcel A Level (9EC0)", d: "Dissertations KAA + Évaluation, diagrammes exploités, 25-markers structurés.", tag: "disponible" },
      { t: "Géographie", b: "OCR A Level (H481)", d: "Command words (« assess », « evaluate »), case studies chiffrées, essais PEEL.", tag: "disponible" },
      { t: "Français · candidat libre", b: "AQA A Level (7652)", d: "Traductions FR↔EN, essais sur œuvre/film, méthode AQA — être natif ne suffit pas pour l'A*.", tag: "disponible" },
    ],
    subjNote: "La voix d'Emma (coaching parlé) arrive — même voix que Coach Emma. D'autres matières et boards suivront.",
    closeTitle1: "Un ami qui sait tout dans la matière.",
    closeTitle2: "Et qui veut vraiment ton ",
    closeCta: "Créer un compte", beta: "Accès en beta privée pendant la phase de test.",
  },
  en: {
    tag: "Personal tutor · GCSE & A Level · UK",
    h1a: "The tutor that never lets go\nbefore the ",
    sub: "Coach Emma Student takes today's lesson, checks it's understood, drills it under exam conditions, marks like an examiner — and reworks whatever's shaky until it holds.",
    ctaStart: "Start", ctaDemo: "Watch the demo", ctaLogin: "Sign in",
    stats: [
      ["45 min", "the effective session, framed by Emma"],
      ["4", "subjects · Maths · Econ · Geog · French"],
      ["M + A", "marked mark by mark, like the examiner"],
      ["A★", "the target — and the curve to prove it"],
    ] as [string, string][],
    howTitle: "How it works",
    steps: [
      "He captures today's lesson — the title, his notes, or a photo taken in class.",
      "Emma writes the course: full or “key concepts”, anchored to the exam-board spec.",
      "She checks mastery concept by concept — and re-explains what's stuck, another way, until it's secure.",
      "He practises under exam conditions: past-paper style exercises, online or on paper + a photo of the script.",
      "Examiner marking: mark by mark, method rewarded, misconceptions named — redo until it's solid.",
      "Nothing is forgotten: fragile points come back automatically, and progress is visible — start → current → A★.",
    ],
    seeDemo: "▶ Watch a session demo",
    whoTitle: "Who it's for",
    who: [
      { ic: "🎓", t: "The A/A* candidate", d: "GCSE or A Level, they have the level but want to secure the last marks: exam technique, constant practice, weak points hunted one by one." },
      { ic: "📈", t: "The grade climber", d: "From C to A, from B to A*: the concept-level diagnosis finds exactly where it breaks, and the loop doesn't let go until it's secure." },
      { ic: "👨‍👩‍👧", t: "Parents", d: "A demanding tutor available every evening, a fraction of a private tutor's price — and progress visible session by session." },
    ],
    subjTitle: "Subjects",
    subjects: [
      { t: "Mathematics", b: "Edexcel A Level (9MA0)", d: "Courses, clean notation, past-paper exercises, marking of photographed scripts.", tag: "available" },
      { t: "Economics", b: "Edexcel A Level (9EC0)", d: "KAA + Evaluation essays, diagrams put to work, structured 25-markers.", tag: "available" },
      { t: "Geography", b: "OCR A Level (H481)", d: "Command words (“assess”, “evaluate”), data-rich case studies, PEEL essays.", tag: "available" },
      { t: "French · private candidate", b: "AQA A Level (7652)", d: "FR↔EN translations, essays on the set work/film, AQA method — being native isn't enough for the A*.", tag: "available" },
    ],
    subjNote: "Emma's voice (spoken coaching) is coming — the same voice as Coach Emma. More subjects and boards will follow.",
    closeTitle1: "A friend who knows the whole subject.",
    closeTitle2: "And really wants your ",
    closeCta: "Create an account", beta: "Private beta access during the test phase.",
  },
};

export default function Landing() {
  const [lang, setLang] = useLang();
  const [demo, setDemo] = useState(false);
  const t = L[lang] || L.fr;

  return (
    <main className="-mx-5 -mt-8" style={{ background: CREAM, color: "#2b2a26" }}>
      {/* ============ HERO + HALO ============ */}
      <div className="relative overflow-hidden">
        <div className="hero-aura" aria-hidden="true" />
        <section className="hero-grid relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-14 grid gap-9 items-center" style={{ gridTemplateColumns: "1.75fr 1fr" }}>
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: "#9a8f2e" }}>{t.tag}</div>
              <LangToggle lang={lang} setLang={setLang} />
            </div>
            <h1 style={{ ...serif, fontWeight: 600, color: EM, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.1, whiteSpace: "pre-line" }} className="mt-3">
              {t.h1a}<em className="not-italic" style={{ color: "#b58a00" }}>A*</em>
            </h1>
            <p className="text-[16px] leading-relaxed mt-4 max-w-[480px]" style={{ color: "#5b574e" }}>{t.sub}</p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: EM, padding: "15px 28px", boxShadow: GLOW_CTA }}>
                {t.ctaStart}
              </Link>
              <button onClick={() => setDemo(true)} className="inline-flex items-center gap-2.5 font-bold rounded-2xl cursor-pointer bg-transparent" style={{ border: `1.5px solid ${EM}`, color: EM, padding: "13px 20px" }}>
                <span className="inline-flex items-center justify-center rounded-full text-white" style={{ width: 22, height: 22, background: EM, fontSize: 10, paddingLeft: 2 }}>▶</span>
                {t.ctaDemo}
              </button>
              <Link href="/login" className="font-bold underline underline-offset-4 py-3 px-1" style={{ color: EM }}>
                {t.ctaLogin}
              </Link>
            </div>
          </div>
          <HeroDemo lang={lang} />
        </section>
      </div>

      {/* ============ BANDEAU PREUVE (émeraude + or, glow) ============ */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#053f30,#0a6a4e 82%)", color: "#eaf3ee" }}>
        <div className="stats-aura" aria-hidden="true" />
        <div className="stats-grid relative z-10 max-w-5xl mx-auto px-5 py-7 grid grid-cols-4 gap-5 text-center">
          {t.stats.map(([n, l]) => (
            <div key={n}>
              <div style={{ ...serif, fontWeight: 800, fontSize: 30, color: GOLD, textShadow: "0 0 18px rgba(250,204,21,.5)" }}>{n}</div>
              <div className="text-[12px] mt-1" style={{ color: "#bfe0d1" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ COMMENT ÇA MARCHE ============ */}
      <section className="max-w-5xl mx-auto px-5 pt-11 pb-12">
        <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 30 }} className="text-center">{t.howTitle}</h2>
        <div className="cards-grid grid grid-cols-2 gap-3 mt-7">
          {t.steps.map((s, idx, arr) => {
            const last = idx === arr.length - 1;
            return (
              <div
                key={idx}
                className="flex gap-3 items-start rounded-2xl"
                style={{
                  padding: 18,
                  background: last ? "linear-gradient(150deg,#053f30,#0a6a4e)" : "#fff",
                  border: last ? "none" : "1px solid #efeadf",
                  boxShadow: CARD_GLOW,
                }}
              >
                <span
                  className="inline-flex items-center justify-center flex-none rounded-lg font-extrabold"
                  style={{ ...serif, fontSize: 15, color: EM, background: GOLD_GRAD, width: 30, height: 30, boxShadow: "0 6px 16px -6px rgba(250,204,21,.7)" }}
                >
                  {idx + 1}
                </span>
                <span className="text-[14px] leading-snug self-center" style={{ color: last ? "#eaf3ee" : "#4a463e" }}>{s}</span>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <button onClick={() => setDemo(true)} className="font-bold rounded-2xl cursor-pointer" style={{ border: `1.5px solid ${EM}`, color: EM, background: "none", padding: "12px 24px" }}>
            {t.seeDemo}
          </button>
        </div>
      </section>

      {/* ============ POUR QUI ============ */}
      <section style={{ background: "#fff", borderTop: "1px solid #ece7db", borderBottom: "1px solid #ece7db" }}>
        <div className="max-w-5xl mx-auto px-5 py-11">
          <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 30 }} className="text-center">{t.whoTitle}</h2>
          <div className="cards-grid3 grid grid-cols-3 gap-4 mt-7">
            {t.who.map((p) => (
              <div key={p.t} className="lift rounded-2xl p-5" style={{ background: CREAM, border: "1px solid #efeadf", boxShadow: CARD_GLOW }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: "#eef6f0" }}>{p.ic}</div>
                <div className="font-bold text-[16px] mt-3" style={{ color: EM }}>{p.t}</div>
                <p className="text-[13.5px] leading-relaxed mt-1.5" style={{ color: "#5b574e" }}>{p.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-7">
            <Link href="/login?register=1" className="cta-glow relative overflow-hidden inline-block font-extrabold rounded-2xl no-underline text-[14px]" style={{ background: GOLD_GRAD, color: EM, padding: "13px 28px", boxShadow: GLOW_CTA }}>
              {t.ctaStart}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ MATIÈRES ============ */}
      <section className="max-w-5xl mx-auto px-5 py-11">
        <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 30 }} className="text-center">{t.subjTitle}</h2>
        <div className="cards-grid grid grid-cols-2 gap-4 mt-7">
          {t.subjects.map((s) => (
            <div key={s.t} className="lift rounded-2xl p-5 bg-white" style={{ border: "1px solid #efeadf", boxShadow: CARD_GLOW }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold" style={{ color: EM }}>{s.t}</h3>
                <span className="chip-acquis">{s.tag}</span>
              </div>
              <p className="font-mono text-[11px] text-faint mt-1">{s.b}</p>
              <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: "#5b574e" }}>{s.d}</p>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-faint text-center mt-4">{t.subjNote}</p>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="max-w-3xl mx-auto px-5 pb-14 text-center">
        <div className="rounded-3xl bg-white p-10" style={{ border: "1px solid #efeadf", boxShadow: CARD_GLOW }}>
          <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 27, lineHeight: 1.25 }}>
            {t.closeTitle1}<br />{t.closeTitle2}<span style={{ color: "#b58a00", fontWeight: 900 }}>A*</span>.
          </h2>
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: EM, padding: "14px 30px", boxShadow: GLOW_CTA }}>
              {t.closeCta}
            </Link>
            <button onClick={() => setDemo(true)} className="font-bold rounded-2xl cursor-pointer" style={{ border: `1.5px solid ${EM}`, color: EM, background: "none", padding: "13px 26px" }}>
              {t.ctaDemo}
            </button>
          </div>
          <p className="text-xs text-faint mt-5">{t.beta}</p>
        </div>
      </section>

      {demo && <DemoStudio lang={lang} onClose={() => setDemo(false)} />}

      <style>{`
        @media(max-width:760px){.hero-grid{grid-template-columns:1fr!important}.cards-grid{grid-template-columns:1fr!important}.cards-grid3{grid-template-columns:1fr!important}.stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:18px!important}}
        .cta-glow{transition:transform .15s, box-shadow .15s}
        .cta-glow:hover{transform:translateY(-2px)}
        .cta-glow::after{content:'';position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);animation:shine 3.6s ease-in-out infinite}
        @keyframes shine{0%{left:-60%}55%,100%{left:130%}}
        .hero-aura{position:absolute;inset:0;pointer-events:none;z-index:0}
        .hero-aura::before{content:'';position:absolute;top:-140px;left:-90px;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(10,106,78,.26),transparent 66%)}
        .hero-aura::after{content:'';position:absolute;top:-10px;right:-60px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,rgba(250,204,21,.30),transparent 62%);animation:floataura 9s ease-in-out infinite}
        @keyframes floataura{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        .stats-aura{position:absolute;top:-70px;left:28%;width:420px;height:320px;background:radial-gradient(circle,rgba(250,204,21,.20),transparent 60%);pointer-events:none}
        .lift{transition:transform .18s, box-shadow .18s}
        .lift:hover{transform:translateY(-4px)}
        @media(prefers-reduced-motion:reduce){.cta-glow::after,.hero-aura::after{animation:none}}
      `}</style>
    </main>
  );
}
