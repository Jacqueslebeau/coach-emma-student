"use client";

// Nav du header : liens de l'app pour un élève connecté, CTA de connexion
// pour un visiteur du site vitrine. Bilingue FR/EN.
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useLang } from "@/lib/i18n";

const T = {
  fr: { login: "Se connecter", start: "Commencer", dash: "Tableau de bord", coach: "Coaching", newLesson: "+ Nouvelle leçon" },
  en: { login: "Sign in", start: "Start", dash: "Dashboard", coach: "Coaching", newLesson: "+ New lesson" },
};

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
      <nav className="flex items-center gap-3 text-sm font-semibold">
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
