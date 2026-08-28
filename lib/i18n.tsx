"use client";

// i18n minimal FR/EN (même mécanique que Coach Emma : ui_lang en localStorage).
import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("fr");
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

export function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line overflow-hidden text-[11px] font-bold">
      {(["fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={lang === l ? "px-2 py-1 bg-indigo text-white" : "px-2 py-1 bg-white text-muted hover:text-indigo"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
