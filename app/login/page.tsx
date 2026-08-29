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
        if (!consent) throw new Error("Consent from a parent or legal guardian is required to create the account.");
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
          setNotice("Account created ✓ Check your inbox to confirm your email, then sign in.");
          setMode("login");
        }
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <Link href="/" className="text-sm text-faint hover:text-indigo font-semibold">← Back to site</Link>
      <div className="card p-8 mt-3">
        {/* Start mène ici : l'élève choisit — créer un compte ou se connecter */}
        <div className="grid grid-cols-2 rounded-xl border border-line overflow-hidden text-sm font-bold mb-5">
          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setNotice(null); }}
            className={mode === "register" ? "py-2.5 bg-indigo text-white" : "py-2.5 bg-white text-muted hover:text-indigo"}
          >
            Create an account
          </button>
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setNotice(null); }}
            className={mode === "login" ? "py-2.5 bg-indigo text-white" : "py-2.5 bg-white text-muted hover:text-indigo"}
          >
            Sign in
          </button>
        </div>
        <h1 className="font-serif font-black text-2xl text-indigo-deep">
          {mode === "login" ? "Sign in" : "Create an account"}
        </h1>
        <p className="text-muted text-sm mt-1.5">
          {mode === "login"
            ? "Pick up right where you left off."
            : "The student's personal space — their subjects, lessons and progress. Signing up requires the consent of a parent or legal guardian."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-semibold">Student's first name</label>
              <input className="input mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Maxence" required />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold">{mode === "register" ? "Student's email" : "Email"}</label>
            <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          {mode === "register" && (
            <>
              <div>
                <label className="text-sm font-semibold">Parent / legal guardian email</label>
                <input className="input mt-1" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" required />
                <p className="text-xs text-faint mt-1">Used for follow-up: consent, the sign-in letter and progress summaries.</p>
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
                  I confirm that the student's parent or legal guardian is aware of this
                  registration and <b className="text-ink">consents</b> to it. They will be able to
                  follow activity and progress, and request deletion of the account at any time.
                </span>
              </label>
            </>
          )}
          {error && <p className="text-sm text-gap font-semibold">{error}</p>}
          {notice && <p className="text-sm text-mastered font-semibold">{notice}</p>}
          <button className="btn-primary w-full !py-3" disabled={busy}>
            {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create the account"}
          </button>
        </form>
        <p className="text-sm text-muted mt-5 text-center">
          {mode === "login" ? (
            <>No account?{" "}
              <button className="text-indigo font-semibold" onClick={() => { setMode("register"); setError(null); }}>Create one here</button></>
          ) : (
            <>Already have an account?{" "}
              <button className="text-indigo font-semibold" onClick={() => { setMode("login"); setError(null); }}>Sign in</button></>
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
