"use client";

// AIDE — Paul, l'assistant support : posez-lui vos questions sur le
// fonctionnement de la plateforme (le contenu scolaire, c'est Emma).
import { useEffect, useRef, useState } from "react";
import BackLink from "@/components/BackLink";
import RichText from "@/components/RichText";

type Msg = { role: "user" | "assistant"; message: string };

const STARTERS = [
  "How does a tutoring session work?",
  "What is the level check?",
  "How is my starting point decided?",
  "Can my parents follow my progress?",
  "How do past papers work here?",
];

export default function HelpPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true); setError(null); setInput("");
    const next: Msg[] = [...messages, { role: "user", message: t }];
    setMessages(next);
    try {
      const r = await fetch("/api/help", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: t, history: messages }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Paul is unavailable — try again.");
      setMessages([...next, { role: "assistant", message: d.reply }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink />
      <div className="flex items-center gap-3 mt-2">
        <span className="h-11 w-11 rounded-full bg-indigo-soft flex items-center justify-center text-xl">🛟</span>
        <div>
          <h1 className="font-serif font-black text-2xl text-indigo-deep">Help — ask Paul</h1>
          <p className="text-muted text-sm">
            Paul explains how the platform works. For lessons and exam content, that&apos;s Emma&apos;s job.
          </p>
        </div>
      </div>

      <div className="card mt-5 p-5 min-h-[280px] max-h-[55vh] overflow-y-auto space-y-3">
        {messages.length === 0 && !busy && (
          <div>
            <p className="text-muted text-sm">Hi! I&apos;m Paul 👋 What would you like to know?</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {STARTERS.map((q) => (
                <button key={q} onClick={() => send(q)} className="btn-ghost !py-1.5 !px-3 text-[13px]">
                  {q}
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
        {busy && <p className="text-sm text-faint">Paul is typing…</p>}
        <div ref={endRef} />
      </div>

      {error && <p className="text-sm text-gap font-semibold mt-2">{error}</p>}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Ask Paul anything about the platform…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
