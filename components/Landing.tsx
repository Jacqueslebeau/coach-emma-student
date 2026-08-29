"use client";

// Site vitrine — STRUCTURE, DESIGN, LAYOUT ET CODE COULEUR de Coach Emma :
// crème #FAF8F3, émeraude #064E3B, or #FACC15, Fraunces ; hero + halo, démo
// animée (HeroDemo), CTA or « Commencer » (effet brillance), « ▶ Voir la
// démo » (DemoStudio : produit / tutoring / coaching), bandeau preuve
// émeraude, Comment ça marche et Pour qui avec « ? » palpitant (mécanique
// Coach Emma). Ton professionnel : ce sont les parents qui achètent.
// Les matières et boards vivent dans la barre de menu (HeaderNav).
import { useState } from "react";
import Link from "next/link";
import HeroDemo from "@/components/HeroDemo";
import DemoStudio, { type Chapter } from "@/components/DemoStudio";
import { useLang } from "@/lib/i18n";

const EM = "#064E3B";
const GOLD = "#FACC15";
const CREAM = "#FAF8F3";
const serif = { fontFamily: "Fraunces, Georgia, serif" } as const;
const GOLD_GRAD = "linear-gradient(180deg,#FFDD57,#FACC15)";
const GLOW_CTA = "0 14px 34px -10px rgba(250,204,21,.72)";
const CARD_GLOW = "0 26px 58px -40px rgba(6,78,59,.5)";

const L = {
  fr: {
    tag: "Tutorat personnel · A Level · UK",
    h1a: "Le tutorat personnel\nqui vise le ",
    h1b: " — et s'y tient.",
    sub: "Coach Emma Student est un tuteur personnel d'excellence pour les élèves de A Level. À partir de la leçon vue en classe, Emma construit le cours ancré sur le programme officiel de l'exam board de l'élève, vérifie la compréhension concept par concept, entraîne en conditions réelles d'examen et corrige chaque copie au standard de l'examinateur.",
    features: [
      ["📘", "Le tutorat", "Cours sur mesure, vérification de maîtrise, exercices type past paper, correction mark par mark — dans la langue et au format de l'examen."],
      ["🎯", "Le coaching d'examen", "Méthode de travail, gestion du stress, préparation des épreuves et performance le jour J — un accompagnement bienveillant et exigeant."],
      ["📊", "Le suivi", "Progression mesurée par matière — niveau de départ, niveau actuel, objectif — visible par l'élève et par ses parents."],
    ] as [string, string, string][],
    ctaStart: "Commencer", ctaDemo: "Voir la démo", ctaLogin: "Se connecter",
    demoMenu: {
      title: "Quelle démo veux-tu voir ?",
      options: [
        { k: "product" as Chapter, ic: "✨", t: "Le produit", d: "Ce qu'est Coach Emma Student, en 3 tableaux." },
        { k: "tutoring" as Chapter, ic: "📘", t: "Une séance de tutoring", d: "La vraie séance de maths de Max, de la leçon à la correction." },
        { k: "coaching" as Chapter, ic: "🎯", t: "Une séance de coaching", d: "Emma coach d'examen : le mental, la méthode, le jour J." },
      ],
    },
    stats: [
      ["45 min", "la séance efficace, cadrée par Emma"],
      ["4", "matières · tous les grands exam boards"],
      ["M + A", "noté mark par mark, comme l'examinateur"],
      ["A★", "l'objectif — et la courbe qui le prouve"],
    ] as [string, string][],
    howTitle: "Comment ça marche",
    howHelp: {
      title: "Le principe",
      body: [
        "Coach Emma Student reproduit la méthode des meilleurs tuteurs particuliers : partir de ce que l'élève a réellement vu en classe, s'assurer que c'est compris, puis entraîner dans les conditions exactes de l'examen — et ne rien laisser passer.",
        "Chaque matière est calibrée sur l'exam board choisi à l'inscription (Edexcel, AQA ou OCR) : les cours suivent le spec officiel, les exercices reprennent les formats des past papers, et la correction applique la logique du mark scheme.",
        "Tout est mesuré : la maîtrise concept par concept, les points fragiles, la progression vers l'objectif. L'élève et ses parents voient exactement où il en est.",
      ],
    },
    steps: [
      {
        t: "L'élève capture sa leçon du jour",
        b: ["Le titre suffit — les notes ou une photo du cours pris en classe affinent le résultat.", "Emma identifie la leçon dans le programme officiel et la découpe en concepts à maîtriser."],
      },
      {
        t: "Emma écrit le cours",
        b: ["Version complète ou « concepts clés » pour réviser vite.", "Ancré sur le spec de l'exam board de l'élève, avec exemples travaillés au format examen.", "Pour chaque concept : où il tombe à l'examen et le piège qui coûte des marks."],
      },
      {
        t: "Vérification de la maîtrise",
        b: ["Des questions courtes, concept par concept — verdict : acquis, fragile ou à revoir.", "Ce qui coince est réexpliqué sous un autre angle, puis re-testé jusqu'à ce que ce soit acquis."],
      },
      {
        t: "Entraînement en conditions d'examen",
        b: ["Exercices au style et au barème des past papers du board.", "En ligne, ou sur papier : l'élève photographie sa copie manuscrite et l'envoie."],
      },
      {
        t: "Correction au standard de l'examinateur",
        b: ["Notation mark par mark : la méthode est valorisée, chaque point perdu est expliqué.", "Les erreurs de technique d'examen sont nommées — ce sont elles qui coûtent le A*.", "On refait sur des variantes tant que ce n'est pas solide."],
      },
      {
        t: "Rien n'est oublié",
        b: ["Les points fragiles reviennent automatiquement en révision.", "La progression s'affiche par matière : départ → actuel → objectif A★.", "Les parents peuvent recevoir le récapitulatif des séances."],
      },
    ],
    seeDemo: "▶ Voir la démo",
    whoTitle: "Pour qui ?",
    whoHelp: {
      title: "À qui s'adresse Coach Emma Student",
      body: [
        "Aux élèves de A Level au Royaume-Uni — dans les matières couvertes, sur les exam boards Edexcel, AQA et OCR — y compris les candidats libres (par exemple le French A Level). Le GCSE suivra.",
        "Aux familles qui veulent l'exigence d'un excellent tuteur particulier, disponible tous les soirs, pour une fraction du coût — avec un suivi objectif de la progression.",
        "L'inscription d'un élève mineur requiert le consentement d'un parent ou tuteur légal, qui peut suivre l'activité et la progression.",
      ],
    },
    who: [
      { ic: "🎓", t: "L'élève qui vise A/A*", d: "Il a le niveau, il veut sécuriser les derniers marks : technique d'examen, pratique constante, points faibles traités un par un." },
      { ic: "📈", t: "L'élève qui veut progresser", d: "De C vers A, de B vers A* : le diagnostic par concept trouve précisément où cela bloque, et la boucle de travail ne s'arrête pas avant l'acquisition." },
      { ic: "👨‍👩‍👧", t: "Les parents", d: "Un tuteur exigeant et bienveillant, disponible chaque soir, pour une fraction du prix d'un tuteur particulier — avec une progression visible séance par séance et un suivi des connexions." },
    ],
    closeTitle1: "L'exigence d'un excellent tuteur.",
    closeTitle2: "La constance en plus — jusqu'au ",
    closeCta: "Créer un compte", beta: "Accès en beta privée pendant la phase de test. Consentement parental requis à l'inscription.",
  },
  en: {
    tag: "Personal tutoring · A Level · UK",
    h1a: "Personal tutoring\nthat aims for the ",
    h1b: " — and holds the line.",
    sub: "Coach Emma Student is a personal tutor built for A Level students. Starting from the lesson seen in class, Emma writes the course anchored to the student's exam-board specification, checks understanding concept by concept, trains under real exam conditions and marks every script to the examiner's standard.",
    features: [
      ["📘", "The tutoring", "Tailored courses, mastery checks, past-paper style exercises, mark-by-mark feedback — in the language and format of the exam."],
      ["🎯", "Exam coaching", "Working method, stress management, exam preparation and performance on the day — demanding, supportive guidance."],
      ["📊", "The tracking", "Measured progress per subject — starting level, current level, target — visible to the student and their parents."],
    ] as [string, string, string][],
    ctaStart: "Start", ctaDemo: "Watch the demo", ctaLogin: "Sign in",
    demoMenu: {
      title: "Which demo would you like to see?",
      options: [
        { k: "product" as Chapter, ic: "✨", t: "The product", d: "What Coach Emma Student is, in 3 scenes." },
        { k: "tutoring" as Chapter, ic: "📘", t: "A tutoring session", d: "Max's real maths session, from lesson to marking." },
        { k: "coaching" as Chapter, ic: "🎯", t: "A coaching session", d: "Emma as exam coach: mindset, method, exam day." },
      ],
    },
    stats: [
      ["45 min", "the effective session, framed by Emma"],
      ["4", "subjects · all major exam boards"],
      ["M + A", "marked mark by mark, like the examiner"],
      ["A★", "the target — and the curve to prove it"],
    ] as [string, string][],
    howTitle: "How it works",
    howHelp: {
      title: "The principle",
      body: [
        "Coach Emma Student reproduces the method of the best private tutors: start from what the student actually covered in class, make sure it is understood, then train under the exact conditions of the exam — and let nothing slip.",
        "Each subject is calibrated to the exam board chosen at sign-up (Edexcel, AQA or OCR): courses follow the official specification, exercises mirror past-paper formats, and marking applies the mark-scheme logic.",
        "Everything is measured: mastery concept by concept, weak points, progress towards the target. The student and their parents see exactly where they stand.",
      ],
    },
    steps: [
      { t: "The student captures today's lesson", b: ["The title is enough — notes or a photo of the lesson refine the result.", "Emma locates the lesson in the official programme and splits it into concepts to master."] },
      { t: "Emma writes the course", b: ["Full version, or “key concepts” for quick revision.", "Anchored to the student's exam-board spec, with worked examples in exam format.", "For each concept: where it appears in the exam and the trap that costs marks."] },
      { t: "Mastery check", b: ["Short questions, concept by concept — verdict: secure, fragile or to review.", "Whatever is stuck is re-explained another way, then re-tested until secure."] },
      { t: "Training under exam conditions", b: ["Exercises in the style and mark tariff of the board's past papers.", "Online, or on paper: the student photographs their handwritten script and uploads it."] },
      { t: "Marking to the examiner's standard", b: ["Mark-by-mark: method is rewarded, every lost mark is explained.", "Exam-technique errors are named — they are what costs the A*.", "Variants are set until it is solid."] },
      { t: "Nothing is forgotten", b: ["Fragile points come back automatically for revision.", "Progress is shown per subject: start → current → A★ target.", "Parents can receive the session summary."] },
    ],
    seeDemo: "▶ Watch the demo",
    whoTitle: "Who it's for",
    whoHelp: {
      title: "Who Coach Emma Student is for",
      body: [
        "A Level students in the UK — in the covered subjects, across Edexcel, AQA and OCR — including private candidates (for example A Level French). GCSE will follow.",
        "Families who want the standards of an excellent private tutor, available every evening, at a fraction of the cost — with objective progress tracking.",
        "Registering a minor requires the consent of a parent or legal guardian, who can follow activity and progress.",
      ],
    },
    who: [
      { ic: "🎓", t: "The A/A* candidate", d: "They have the level and want to secure the final marks: exam technique, constant practice, weak points addressed one by one." },
      { ic: "📈", t: "The grade climber", d: "From C to A, from B to A*: concept-level diagnosis finds precisely where it breaks, and the working loop doesn't stop before mastery." },
      { ic: "👨‍👩‍👧", t: "Parents", d: "A demanding, supportive tutor available every evening, at a fraction of a private tutor's price — with progress visible session by session and a log of console connections." },
    ],
    closeTitle1: "The standards of an excellent tutor.",
    closeTitle2: "Plus the consistency — all the way to the ",
    closeCta: "Create an account", beta: "Private beta access during the test phase. Parental consent required at sign-up.",
  },
};

// « ? » palpitant (mécanique Coach Emma) : cliquer ouvre l'explication.
function PulseHelp({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="pulse-help inline-flex items-center justify-center rounded-full font-black align-middle ml-3 cursor-pointer"
      style={{ ...serif, width: 30, height: 30, fontSize: 17, color: EM, background: GOLD_GRAD, border: "none" }}
    >
      ?
    </button>
  );
}

// La fiche du « ? » : ÉMERAUDE premium (halo doré, filet or, texte menthe) —
// c'est elle qui porte le vert, pas la section.
function HelpModal({ title, body, onClose }: { title: string; body: string[]; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4,32,24,.55)", backdropFilter: "blur(3px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg,#04382b,#0a6a4e 88%)", boxShadow: "0 40px 90px -30px rgba(2,20,14,.85)" }}
      >
        <div className="stats-aura" aria-hidden="true" />
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-lg text-lg leading-none text-white/80 bg-white/10 hover:bg-white/20 z-10">×</button>
        <div className="relative z-10">
          <span
            className="inline-flex items-center justify-center rounded-full font-black"
            style={{ ...serif, width: 34, height: 34, fontSize: 19, color: EM, background: GOLD_GRAD, boxShadow: "0 8px 22px -6px rgba(250,204,21,.75)" }}
          >
            ?
          </span>
          <h3 className="mt-3" style={{ ...serif, fontWeight: 600, color: "#f3f8f5", fontSize: 24, lineHeight: 1.2 }}>{title}</h3>
          <div className="mt-2 h-[3px] w-14 rounded-full" style={{ background: GOLD_GRAD, boxShadow: "0 0 14px rgba(250,204,21,.55)" }} />
          <div className="mt-4 space-y-3.5">
            {body.map((p, i) => (
              <p key={i} className="flex gap-2.5 text-[14.5px] leading-relaxed" style={{ color: "#d5e8dd" }}>
                <span style={{ color: GOLD }} className="shrink-0">✦</span>
                <span>{p}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [lang] = useLang();
  // « Voir la démo » ouvre d'abord le CHOIX de la démo (produit / tutoring /
  // coaching), puis le studio démarre sur le chapitre choisi.
  const [chooser, setChooser] = useState(false);
  const [demo, setDemo] = useState<Chapter | null>(null);
  const [help, setHelp] = useState<null | "how" | "who">(null);
  const t = L[lang] || L.en;

  return (
    <main className="-mx-5 -mt-8" style={{ background: CREAM, color: "#2b2a26" }}>
      {/* ============ HERO + HALO ============ */}
      <div className="relative overflow-hidden">
        <div className="hero-aura" aria-hidden="true" />
        <section className="hero-grid relative z-10 max-w-5xl mx-auto px-5 pt-10 pb-14 grid gap-9 items-center" style={{ gridTemplateColumns: "1.75fr 1fr" }}>
          <div>
            <div className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: "#9a8f2e" }}>{t.tag}</div>
            <h1 style={{ ...serif, fontWeight: 600, color: EM, fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.12, whiteSpace: "pre-line" }} className="mt-3">
              {t.h1a}<em className="not-italic" style={{ color: "#b58a00" }}>A*</em>{t.h1b}
            </h1>
            <p className="text-[15px] leading-relaxed mt-4 max-w-[520px]" style={{ color: "#5b574e" }}>{t.sub}</p>
            <div className="mt-4 space-y-2 max-w-[520px]">
              {t.features.map(([ic, tt, d]) => (
                <div key={tt} className="flex gap-2.5 items-start">
                  <span className="text-[15px] leading-6">{ic}</span>
                  <p className="text-[13.5px] leading-snug" style={{ color: "#5b574e" }}>
                    <b style={{ color: EM }}>{tt}.</b> {d}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: EM, padding: "15px 28px", boxShadow: GLOW_CTA }}>
                {t.ctaStart}
              </Link>
              <button onClick={() => setChooser(true)} className="inline-flex items-center gap-2.5 font-bold rounded-2xl cursor-pointer bg-transparent" style={{ border: `1.5px solid ${EM}`, color: EM, padding: "13px 20px" }}>
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

      {/* ============ COMMENT ÇA MARCHE — blanc, comme le reste de la page ;
           le « ? » ouvre la fiche VERTE bien designée ============ */}
      <section className="max-w-5xl mx-auto px-5 pt-11 pb-12">
        <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 30 }} className="text-center">
          {t.howTitle}
          <PulseHelp onClick={() => setHelp("how")} label={t.howHelp.title} />
        </h2>
        <div className="cards-grid grid grid-cols-2 gap-4 mt-7">
          {t.steps.map((s, idx) => (
            <div
              key={idx}
              className="lift flex gap-3.5 items-start rounded-2xl bg-white"
              style={{ padding: 20, border: "1px solid #efeadf", boxShadow: CARD_GLOW }}
            >
              <span
                className="inline-flex items-center justify-center flex-none rounded-xl font-extrabold"
                style={{ ...serif, fontSize: 16, color: EM, background: GOLD_GRAD, width: 34, height: 34, boxShadow: "0 8px 20px -6px rgba(250,204,21,.75)" }}
              >
                {idx + 1}
              </span>
              <div>
                <p className="text-[15px] font-bold leading-snug" style={{ color: EM }}>{s.t}</p>
                <ul className="mt-2 space-y-1.5">
                  {s.b.map((line, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-snug" style={{ color: "#5b574e" }}>
                      <span style={{ color: "#b58a00" }}>✦</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-7">
          <button onClick={() => setChooser(true)} className="font-bold rounded-2xl cursor-pointer" style={{ border: `1.5px solid ${EM}`, color: EM, background: "none", padding: "12px 24px" }}>
            {t.seeDemo}
          </button>
        </div>
      </section>

      {/* ============ POUR QUI ============ */}
      <section style={{ background: "#fff", borderTop: "1px solid #ece7db", borderBottom: "1px solid #ece7db" }}>
        <div className="max-w-5xl mx-auto px-5 py-11">
          <h2 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 30 }} className="text-center">
            {t.whoTitle}
            <PulseHelp onClick={() => setHelp("who")} label={t.whoHelp.title} />
          </h2>
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

      {/* ============ CTA FINAL — panneau émeraude, pleine largeur du site ============ */}
      <section className="max-w-5xl mx-auto px-5 py-14 text-center">
        <div className="relative overflow-hidden rounded-3xl p-10" style={{ background: "linear-gradient(150deg,#053f30,#0a6a4e)", boxShadow: "0 34px 70px -34px rgba(6,78,59,.75)" }}>
          <div className="stats-aura" aria-hidden="true" />
          <h2 className="relative z-10" style={{ ...serif, fontWeight: 600, color: "#eaf3ee", fontSize: 27, lineHeight: 1.25 }}>
            {t.closeTitle1}<br />{t.closeTitle2}<span style={{ color: GOLD, fontWeight: 900, textShadow: "0 0 18px rgba(250,204,21,.5)" }}>A*</span>.
          </h2>
          <div className="relative z-10 flex justify-center gap-3 mt-6 flex-wrap">
            <Link href="/login?register=1" className="cta-glow relative overflow-hidden font-extrabold rounded-2xl no-underline" style={{ background: GOLD_GRAD, color: EM, padding: "14px 30px", boxShadow: GLOW_CTA }}>
              {t.closeCta}
            </Link>
            <button onClick={() => setChooser(true)} className="font-bold rounded-2xl cursor-pointer" style={{ border: "1.5px solid rgba(255,255,255,.75)", color: "#eaf3ee", background: "none", padding: "13px 26px" }}>
              {t.ctaDemo}
            </button>
          </div>
          <p className="relative z-10 text-xs mt-5" style={{ color: "#9fc9b6" }}>{t.beta}</p>
        </div>
      </section>

      {/* Choix de la démo — avant d'entrer dans le studio */}
      {chooser && (
        <div
          onClick={() => setChooser(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(4,32,24,.55)", backdropFilter: "blur(3px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 relative"
            style={{ boxShadow: "0 40px 90px -30px rgba(6,78,59,.7)" }}
          >
            <button onClick={() => setChooser(false)} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 rounded-lg text-lg leading-none text-muted bg-paper hover:bg-line">×</button>
            <h3 style={{ ...serif, fontWeight: 600, color: EM, fontSize: 21 }}>{t.demoMenu.title}</h3>
            <div className="mt-4 space-y-2.5">
              {t.demoMenu.options.map((o) => (
                <button
                  key={o.k}
                  onClick={() => { setChooser(false); setDemo(o.k); }}
                  className="w-full text-left flex items-start gap-3 rounded-2xl p-4 cursor-pointer transition hover:-translate-y-0.5"
                  style={{ background: CREAM, border: "1px solid #efeadf", boxShadow: CARD_GLOW }}
                >
                  <span className="text-xl leading-6">{o.ic}</span>
                  <span>
                    <span className="block font-bold text-[15px]" style={{ color: EM }}>{o.t}</span>
                    <span className="block text-[13px] mt-0.5" style={{ color: "#5b574e" }}>{o.d}</span>
                  </span>
                  <span className="ml-auto self-center font-bold" style={{ color: "#b58a00" }}>▶</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {demo && <DemoStudio lang={lang} initialChapter={demo} onClose={() => setDemo(null)} />}
      {help === "how" && <HelpModal title={t.howHelp.title} body={t.howHelp.body} onClose={() => setHelp(null)} />}
      {help === "who" && <HelpModal title={t.whoHelp.title} body={t.whoHelp.body} onClose={() => setHelp(null)} />}

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
        .how-aura{position:absolute;bottom:-120px;right:-60px;width:520px;height:420px;background:radial-gradient(circle,rgba(250,204,21,.13),transparent 62%);pointer-events:none}
        .lift{transition:transform .18s, box-shadow .18s}
        .lift:hover{transform:translateY(-4px)}
        .pulse-help{animation:pulsehelp 1.8s ease-in-out infinite;box-shadow:0 0 0 0 rgba(250,204,21,.65)}
        .pulse-help:hover{animation-play-state:paused}
        @keyframes pulsehelp{0%{box-shadow:0 0 0 0 rgba(250,204,21,.65)}70%{box-shadow:0 0 0 14px rgba(250,204,21,0)}100%{box-shadow:0 0 0 0 rgba(250,204,21,0)}}
        @media(prefers-reduced-motion:reduce){.cta-glow::after,.hero-aura::after,.pulse-help{animation:none}}
      `}</style>
    </main>
  );
}
