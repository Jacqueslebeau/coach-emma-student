"use client";

// Suivi parent : consentement, email du parent/tuteur (modifiable), journal
// des connexions à la console, et envoi de la « lettre de connexion » au
// parent (ouvre l'email pré-rempli avec le récapitulatif).
import { useEffect, useState } from "react";

type Login = { id: string; at: string; user_agent: string };
type Profile = { first_name: string; parent_email: string | null; parent_consent_at: string | null };

function device(ua: string): string {
  if (/iPhone|iPad/.test(ua)) return "iPhone/iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Device";
}

function fmt(at: string) {
  return new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ParentPanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logins, setLogins] = useState<Login[]>([]);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/profile").then((r) => r.json()).then((p) => { setProfile(p); setEmail(p.parent_email || ""); }).catch(() => {});
    fetch("/api/logins").then((r) => r.json()).then((d) => setLogins(d.logins || [])).catch(() => {});
  };
  useEffect(load, []);

  async function saveEmail() {
    setSaving(true);
    try {
      await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ parent_email: email }) });
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const site = typeof window !== "undefined" ? window.location.origin : "https://coach-emma-student.vercel.app";

  // Rapport de progression pour les parents : chaque matière, départ → actuel → objectif.
  const report = async () => {
    const name = profile?.first_name || "the student";
    let lines = "";
    try {
      const d = await fetch("/api/overview").then((r) => r.json());
      lines = (d.enrolments || [])
        .map((e: { subject: string; board: string; baseline_grade: string | null; gcse_grade?: string | null; target_grade: string; exam_date: string | null }) => {
          const roll = (d.by_subject || {})[e.subject] || {};
          const cur = roll.estimated_grade || e.baseline_grade || "—";
          const startTxt = e.gcse_grade ? `GCSE ${e.gcse_grade}` : `level ${e.baseline_grade || "—"}`;
          return `  • ${e.subject.toUpperCase()} (${e.board}) — start: ${startTxt} · current: ~${cur} · target: ${e.target_grade}` +
            `${roll.lessons ? ` · ${roll.lessons} lessons, ${Math.round((roll.minutes || 0) / 6) / 10} h` : ""}` +
            `${e.exam_date ? ` · exam ${String(e.exam_date).slice(0, 7)}` : ""}`;
        })
        .join("\n");
    } catch { /* rapport minimal */ }
    const subject = encodeURIComponent(`Coach Emma Student — ${name}'s progress report`);
    const body = encodeURIComponent(
      `Hello,\n\n` +
      `Here is ${name}'s progress with Coach Emma Student:\n\n` +
      `${lines || "  (subjects being set up)"}\n\n` +
      `Every session is logged and reviewable on the console: ${site}\n\n` +
      `Coach Emma Student`
    );
    window.location.href = `mailto:${profile?.parent_email || ""}?subject=${subject}&body=${body}`;
  };
  const letter = () => {
    const name = profile?.first_name || "the student";
    const lines = logins.slice(0, 10).map((l) => `  - ${fmt(l.at)} (${device(l.user_agent)})`).join("\n");
    const subject = encodeURIComponent(`Coach Emma Student — ${name}'s progress`);
    const body = encodeURIComponent(
      `Hello,\n\n` +
      `${name} is using Coach Emma Student, their personal A Level tutor (lessons, exercises under exam conditions, marking to the examiner's standard, and exam coaching).\n\n` +
      `Their console: ${site}\n\n` +
      `Latest sign-ins to the console:\n${lines || "  (no sign-ins recorded yet)"}\n\n` +
      `You can follow their progress by subject (starting grade → current grade → target) directly on their dashboard.\n\n` +
      `Coach Emma Student`
    );
    window.location.href = `mailto:${profile?.parent_email || ""}?subject=${subject}&body=${body}`;
  };

  if (!profile) return null;

  return (
    <section className="card mt-6 p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="font-serif font-semibold text-lg">👨‍👩‍👧 Parent follow-up & sign-ins</h2>
        {profile.parent_consent_at && (
          <span className="chip-acquis">parental consent ✓ {new Date(profile.parent_consent_at).toLocaleDateString("en-GB")}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
        <span className="text-muted">Parent / legal guardian:</span>
        {editing ? (
          <span className="flex items-center gap-2">
            <input className="input !py-1 !px-2 !text-[13px] w-72" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com, parent2@example.com" title="One or several emails, separated by commas" />
            <button onClick={saveEmail} disabled={saving} className="btn-primary !py-1 !px-3 text-[12.5px]">OK</button>
          </span>
        ) : (
          <>
            <span className="font-semibold">{profile.parent_email || "not provided"}</span>
            <button onClick={() => setEditing(true)} className="text-indigo font-semibold text-[13px]">edit</button>
          </>
        )}
        {profile.parent_email && (
          <>
            <button onClick={letter} className="btn-ghost !py-1.5 !px-3.5 text-[13px]">✉️ Sign-in letter</button>
            <button onClick={report} className="btn-amber !py-1.5 !px-3.5 text-[13px]">✉️ Send the progress report</button>
          </>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-faint mb-2">Latest sign-ins to the console</p>
        {logins.length === 0 ? (
          <p className="text-sm text-faint">No sign-ins recorded yet (the log starts now).</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {logins.slice(0, 12).map((l) => (
              <span key={l.id} className="chip-todo !text-[11.5px]" title={l.user_agent}>
                {fmt(l.at)} · {device(l.user_agent)}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
