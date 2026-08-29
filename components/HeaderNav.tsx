"use client";

// Nav du header : pour un visiteur du site vitrine — menus déroulants
// « Matières » et « Exam boards » (informatifs : chaque entrée montre les
// boards/specs couverts) + connexion ; pour un élève connecté — liens de
// l'app. Bilingue FR/EN.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useLang } from "@/lib/i18n";
import { BOARD_OPTIONS, SUBJECTS, SUBJECT_KEYS } from "@/lib/subjects";

const T = {
  fr: {
    login: "Se connecter", start: "Commencer", dash: "Tableau de bord", coach: "Coaching", newLesson: "+ Nouvelle leçon",
    subjects: "Matières", boards: "Exam boards",
    boardNote: "L'élève choisit son board à l'inscription — cours, exercices et corrections sont calibrés sur son spec.",
  },
  en: {
    login: "Sign in", start: "Start", dash: "Dashboard", coach: "Coaching", newLesson: "+ New lesson",
    subjects: "Subjects", boards: "Exam boards",
    boardNote: "Students pick their board at sign-up — courses, exercises and marking are calibrated to their spec.",
  },
};

// Boards → matières couvertes (dérivé de la bibliothèque).
function boardsIndex(lang: "fr" | "en") {
  const map = new Map<string, string[]>();
  for (const k of SUBJECT_KEYS) {
    for (const o of BOARD_OPTIONS[k]) {
      const label = lang === "fr" ? SUBJECTS[k].labelFr : SUBJECTS[k].labelEn;
      const arr = map.get(o.label) || [];
      arr.push(`${label} (${o.spec})`);
      map.set(o.label, arr);
    }
  }
  return ["Edexcel", "AQA", "OCR"].filter((b) => map.has(b)).map((b) => ({ board: b, covers: map.get(b)! }));
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-muted hover:text-indigo font-semibold"
        aria-expanded={open}
      >
        {label} <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-[300px] bg-white rounded-2xl border border-line p-4 z-40"
          style={{ boxShadow: "0 26px 58px -30px rgba(6,78,59,.45)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function HeaderNav() {
  const [logged, setLogged] = useState<boolean | null>(null);
  const [lang] = useLang();
  const t = T[lang] || T.fr;

  useEffect(() => {
    supabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setLogged(!!data.session))
      .catch(() => setLogged(false));
  }, []);

  if (logged === null) return <nav className="h-8" aria-hidden />;

  if (!logged) {
    return (
      <nav className="flex items-center gap-4 text-sm font-semibold">
        <div className="hidden sm:flex items-center gap-4">
          <Dropdown label={t.subjects}>
            <div className="space-y-3">
              {SUBJECT_KEYS.map((k) => {
                const s = SUBJECTS[k];
                return (
                  <div key={k} className="border-b border-line last:border-0 pb-2.5 last:pb-0">
                    <p className="font-bold text-[13.5px] text-indigo-deep">
                      {lang === "fr" ? s.labelFr : s.labelEn}
                    </p>
                    <p className="font-mono text-[11px] text-faint mt-0.5">
                      {BOARD_OPTIONS[k].map((o) => `${o.label} ${o.spec}`).join(" · ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </Dropdown>
          <Dropdown label={t.boards}>
            <div className="space-y-3">
              {boardsIndex(lang).map((b) => (
                <div key={b.board} className="border-b border-line last:border-0 pb-2.5 last:pb-0">
                  <p className="font-bold text-[13.5px] text-indigo-deep">{b.board}</p>
                  <p className="text-[12px] text-muted mt-0.5">{b.covers.join(" · ")}</p>
                </div>
              ))}
              <p className="text-[11.5px] text-faint leading-snug">{t.boardNote}</p>
            </div>
          </Dropdown>
        </div>
        <Link href="/login" className="text-muted hover:text-indigo">{t.login}</Link>
        <Link href="/login?register=1" className="btn-amber !py-1.5 !px-3.5 text-[13px]">{t.start}</Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm font-semibold">
      <Link href="/dashboard" className="text-muted hover:text-indigo">{t.dash}</Link>
      <Link href="/coaching" className="text-muted hover:text-indigo">{t.coach}</Link>
      <Link href="/lesson/new" className="btn-primary !py-1.5 !px-3.5 text-[13px]">{t.newLesson}</Link>
    </nav>
  );
}
