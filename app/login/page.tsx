"use client";

// Auth Coach Emma Student — volontairement simple pour la Phase 0 :
// connexion / création de compte par email + mot de passe.
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
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
        router.push(nextPath);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
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
      <div className="card p-8">
        <h1 className="font-serif font-black text-2xl text-indigo-deep">
          {mode === "login" ? "Connexion" : "Créer ton compte"}
        </h1>
        <p className="text-muted text-sm mt-1.5">
          {mode === "login"
            ? "Reprends là où tu t'étais arrêté."
            : "Ton espace personnel — tes leçons, ta progression, tes points à travailler."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-semibold">Prénom</label>
              <input className="input mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maxence" required />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">Mot de passe</label>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          {error && <p className="text-sm text-gap font-semibold">{error}</p>}
          {notice && <p className="text-sm text-mastered font-semibold">{notice}</p>}
          <button className="btn-primary w-full !py-3" disabled={busy}>
            {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
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
