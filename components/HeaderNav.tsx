"use client";

// Nav du header : liens de l'app pour un élève connecté, CTA de connexion
// pour un visiteur du site marketing.
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function HeaderNav() {
  const [logged, setLogged] = useState<boolean | null>(null);

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
        <Link href="/login" className="text-muted hover:text-indigo">Se connecter</Link>
        <Link href="/login?register=1" className="btn-primary !py-1.5 !px-3.5 text-[13px]">Commencer</Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-3 text-sm font-semibold">
      <Link href="/dashboard" className="text-muted hover:text-indigo">Tableau de bord</Link>
      <Link href="/coaching" className="text-muted hover:text-indigo">Coaching</Link>
      <Link href="/lesson/new" className="btn-primary !py-1.5 !px-3.5 text-[13px]">+ Nouvelle leçon</Link>
    </nav>
  );
}
