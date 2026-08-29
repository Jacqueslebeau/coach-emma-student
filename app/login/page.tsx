"use client";

// Auth Coach Emma Student : connexion / création de compte par email + mot
// de passe. L'élève est mineur : l'inscription exige l'email du parent ou
// tuteur légal et son consentement (horodaté en base). Chaque connexion
// réussie est journalisée (visible au tableau de bord, transmissible au
// parent).
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get("register") === "1") setMode("register");
  }, [params]);

  const nextPath = (() => {
    const p = params.get("next");
    // chemin interne uniquement : bloque l'open redirect
    return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\") ? p : "/dashboard";
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    const supabase = supabaseBrowser();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetch("/api/logins", { method: "POST" }).catch(() => {});
        router.push(nextPath);
        router.refresh();
      } else {
        if (!consent) throw new Error("Le consentement du parent ou tuteur légal est requis pour créer le compte.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              parent_email: parentEmail.trim(),
              parent_consent: "true",
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          await fetch("/api/logins", { method: "POST" }).catch(() => {});
          router.push("/onboarding");
          router.refresh();
        } else {
          setNotice("Compte créé ✓ Vérifie ta boîte mail pour confirmer ton email, puis connecte-toi.");
          setMode("login");
        }
      }
    } catch (err) {
      setError((err as Error).message || "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <Link href="/" className="text-sm text-faint hover:text-indigo font-semibold">← Retour au site</Link>
      <div className="card p-8 mt-3">
        <h1 className="font-serif font-black text-2xl text-indigo-deep">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="text-muted text-sm mt-1.5">
          {mode === "login"
            ? "Reprends là où tu t'étais arrêté."
            : "L'espace personnel de l'élève — ses matières, ses leçons, sa progression. L'inscription requiert le consentement d'un parent ou tuteur légal."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-semibold">Prénom de l'élève</label>
              <input className="input mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maxence" required />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">{mode === "register" ? "Email de l'élève" : "Email"}</label>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">Mot de passe</label>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          {mode === "register" && (
            <>
              <div>
                <label className="text-sm font-semibold">Email du parent / tuteur légal</label>
                <input className="input mt-1" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@exemple.com" required />
                <p className="text-xs text-faint mt-1">Utilisé pour le suivi : consentement, lettre de connexion et récapitulatifs.</p>
              </div>
              <label className="flex items-start gap-2.5 text-[13px] leading-snug cursor-pointer bg-indigo-soft rounded-xl px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#064E3B]"
                  required
                />
                <span className="text-muted">
                  Je certifie que le parent ou tuteur légal de l'élève a pris connaissance de cette
                  inscription et y <b className="text-ink">consent</b>. Il pourra suivre l'activité
                  et la progression, et demander la suppression du compte à tout moment.
                </span>
              </label>
            </>
          )}
          {error && <p className="text-sm text-gap font-semibold">{error}</p>}
          {notice && <p className="text-sm text-mastered font-semibold">{notice}</p>}
          <button className="btn-primary w-full !py-3" disabled={busy}>
            {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <p className="text-sm text-muted mt-5 text-center">
          {mode === "login" ? (
            <>Pas de compte ?{" "}
              <button className="text-indigo font-semibold" onClick={() => { setMode("register"); setError(null); }}>Crée-le ici</button></>
          ) : (
            <>Déjà un compte ?{" "}
              <button className="text-indigo font-semibold" onClick={() => { setMode("login"); setError(null); }}>Connecte-toi</button></>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
