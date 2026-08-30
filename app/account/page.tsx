"use client";

// MON COMPTE — l'espace administratif : abonnement & factures (bientôt),
// suivi parental, connexions, intégrations, et la déconnexion.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import BackLink from "@/components/BackLink";
import ParentPanel from "@/components/ParentPanel";
import IntegrationsPanel from "@/components/IntegrationsPanel";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <BackLink />
      <h1 className="font-serif font-black text-3xl text-indigo-deep mt-2">My account</h1>
      {email && <p className="text-muted mt-1">{email}</p>}

      {/* Abonnement & factures — à venir */}
      <section className="card p-6 mt-6">
        <h2 className="font-serif font-semibold text-lg">Plan &amp; billing</h2>
        <p className="text-sm text-muted mt-1">
          Manage your subscription and download your invoices.
        </p>
        <span className="chip-todo inline-block mt-3">Coming soon</span>
      </section>

      {/* Suivi parental + connexions + intégrations */}
      <ParentPanel />
      <IntegrationsPanel />

      <section className="card p-6 mt-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif font-semibold text-lg">Sign out</h2>
          <p className="text-sm text-muted mt-1">You can sign back in any time.</p>
        </div>
        <button onClick={logout} className="btn-ghost !py-2 !px-4">Sign out</button>
      </section>
    </div>
  );
}
