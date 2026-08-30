"use client";

// Coaching d'examen : pas du contenu — le mental, la préparation, le jour J.
// Emma écoute, guide, motive ; chaque séance repart avec des actions concrètes.
import { useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";
import BackLink from "@/components/BackLink";
import EmmaStyle from "@/components/EmmaStyle";

type Msg = { role: string; message: string };

const OPENERS = [
  "How does the exam day actually unfold?",
  "What do examiners expect from me on the day?",
  "How should I prepare the day before the exam?",
  "I'm feeling stressed about my exams — what do I do?",
  "Help me build a revision timetable",
  "How do I manage my time during the paper?",
];

export default function CoachingPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [wrap, setWrap] = useState<{ covered: string[]; coach_note: string } | null>(null);
  const [wrapBusy, setWrapBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Fin de séance : Emma écrit le débrief (loggé au dashboard + envoyable par email).
  async function endSession() {
    setWrapBusy(true); setError(null);
    try {
      const r = await fetch("/api/coaching", { method: "PATCH" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not build the recap");
      setWrap(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setWrapBusy(false);
    }
  }

  function wrapMailto() {
    if (!wrap) return "#";
    const body =
      `Coach Emma Student — coaching session recap\n\n` +
      `What we worked on:\n${wrap.covered.map((c) => `• ${c}`).join("\n")}\n\n` +
      `${wrap.coach_note}\n\nFull history: https://coach-emma-student.vercel.app/dashboard`;
    return `mailto:?subject=${encodeURIComponent("Coaching session recap — Coach Emma Student")}&body=${encodeURIComponent(body)}`;
  }

  useEffect(() => {
    fetch("/api/coaching")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load your coaching history"))))
      .then((d) => { setMessages(d.messages || []); setFirstName(d.first_name || ""); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true); setError(null); setInput("");
    setMessages((m) => [...m, { role: "user", message: t }]);
    try {
      const r = await fetch("/api/coaching", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: t }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong — try again.");
      setMessages((m) => [...m, { role: "assistant", message: d.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink />
      <div className="flex items-end justify-between flex-wrap gap-3 mt-2">
        <div>
          <h1 className="font-serif font-black text-2xl text-indigo-deep">Exam coaching</h1>
          <p className="text-muted text-sm mt-1">
            No maths here: we prepare the competitor. How you're feeling, how to get ready,
            how to perform on the big day. Ideal session: 15-20 min.
          </p>
        </div>
        {messages.length > 1 && !wrap && (
          <button type="button" onClick={endSession} disabled={wrapBusy} className="btn-ghost !py-1.5 !px-3 text-[13px] shrink-0">
            {wrapBusy ? "Wrapping up…" : "End session — get my recap"}
          </button>
        )}
      </div>

      {wrap && (
        <div className="card p-5 mt-4 border-indigo bg-indigo-soft/40">
          <p className="font-serif font-semibold text-indigo-deep">Session recap</p>
          <ul className="mt-2 space-y-1">
            {wrap.covered.map((c, i) => (
              <li key={i} className="text-sm flex gap-2"><span className="text-amber">✔</span><span>{c}</span></li>
            ))}
          </ul>
          {wrap.coach_note && <p className="text-sm text-muted mt-2 italic">{wrap.coach_note}</p>}
          <a href={wrapMailto()} className="text-sm font-semibold text-indigo hover:text-indigo-deep inline-block mt-3">✉ Email me this recap</a>
        </div>
      )}

      <div className="mt-4"><EmmaStyle /></div>

      <div className="card mt-3 p-5 min-h-[300px] max-h-[55vh] overflow-y-auto space-y-3">
        {messages.length === 0 && !busy && (
          <div>
            <p className="text-muted text-sm">
              Hi {firstName || ""} 👋 What would you like to talk about? A few ideas:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {OPENERS.map((o) => (
                <button key={o} onClick={() => send(o)} className="btn-ghost !py-1.5 !px-3 text-[13px]">
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%] text-[15px]"
                  : "bg-indigo-soft text-ink rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]"
              }
            >
              {m.role === "user" ? m.message : <RichText text={m.message} />}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-faint">Emma is thinking…</p>}
        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-gap font-semibold mt-2">{error}</p>}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-3 flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="Tell her what's on your mind…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
      <p className="text-[11px] text-faint mt-2">
        Emma is a study coach, not a healthcare professional. If things really aren't okay, talk to your
        parents or a trusted adult.
      </p>
    </div>
  );
}
