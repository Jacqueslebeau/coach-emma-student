"use client";

// i18n minimal EN/FR (même mécanique que Coach Emma : ui_lang en localStorage).
// L'ANGLAIS est la langue par défaut : le produit prépare des A Levels UK.
import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("ui_lang") : null;
    if (v === "fr" || v === "en") setLangState(v);
    const on = (e: Event) => {
      const l = (e as CustomEvent).detail;
      if (l === "fr" || l === "en") setLangState(l);
    };
    window.addEventListener("ui-lang", on);
    return () => window.removeEventListener("ui-lang", on);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("ui_lang", l); } catch { /* privé */ }
    try { window.dispatchEvent(new CustomEvent("ui-lang", { detail: l })); } catch { /* ssr */ }
  };
  return [lang, setLang];
}

// Sélecteur de langue — EN d'abord (défaut), segments nets et espacés.
export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line overflow-hidden text-[11.5px] font-bold divide-x divide-line">
      {(["en", "fr"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={lang === l ? "px-3 py-1.5 bg-indigo text-white" : "px-3 py-1.5 bg-white text-muted hover:text-indigo"}
        >
          {l === "en" ? "EN 🇬🇧" : "FR"}
        </button>
      ))}
    </div>
  );
}
