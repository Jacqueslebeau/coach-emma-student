"use client";

// COACHING AVEC EMMA — même expérience que Coach Emma (le produit d'origine) :
// Emma est DÉJÀ là avec son mot d'accueil, tu écris OU tu lui PARLES au micro
// (🎙 Talk to Emma, reconnaissance vocale en-GB), elle répond en secondes et
// à voix haute, et tu termines par « End session & get my recap ».
import { useCallback, useEffect, useRef, useState } from "react";
import RichText from "@/components/RichText";
import BackLink from "@/components/BackLink";
import EmmaStyle from "@/components/EmmaStyle";
import EmmaFace from "@/components/EmmaFace";
import { useEmmaAudio } from "@/lib/useEmmaAudio";

type Msg = { role: string; message: string };

const OPENERS = [
  "How does the exam day actually unfold?",
  "What do examiners expect from me on the day?",
  "How should I prepare the day before the exam?",
  "I'm feeling stressed about my exams — what do I do?",
  "Help me build a revision timetable",
  "How do I manage my time during the paper?",
];

// Reconnaissance vocale du navigateur (Chrome/Edge/Safari) — pas de serveur.
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
};
function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function CoachingPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [wrap, setWrap] = useState<{ covered: string[]; coach_note: string } | null>(null);
  const [wrapBusy, setWrapBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true); // le coaching est PARLÉ par défaut
  const [listening, setListening] = useState(false);
  const [micUnsupported, setMicUnsupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const voice = useEmmaAudio();
  const speaking = voice.state === "playing";

  useEffect(() => {
    fetch("/api/coaching")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load your coaching history"))))
      .then((d) => { setMessages(d.messages || []); setFirstName(d.first_name || ""); })
      .catch((e) => setError(e.message));
  }, []);

  // Suit le fil SANS faire défiler la page entière (block: nearest = seul le
  // conteneur de chat bouge) et jamais au premier rendu (l'en-tête reste vu).
  useEffect(() => {
    if (messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const send = useCallback(async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    if (voiceOn) voice.unlock(); // dans le geste utilisateur, avant tout await
    setBusy(true); setError(null); setInput("");
    setMessages((m) => [...m, { role: "user", message: t }]);
    try {
      const r = await fetch("/api/coaching", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: t }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Something went wrong — try again.");
      setMessages((m) => [...m, { role: "assistant", message: d.reply }]);
      if (voiceOn) voice.speak(d.reply);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [busy, voiceOn, voice]);

  // 🎙 Talk to Emma : le micro écoute (en-GB), ta phrase part comme message.
  function toggleMic() {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = getRecognition();
    if (!rec) { setMicUnsupported(true); return; }
    voice.unlock(); // le clic micro débloque aussi la voix d'Emma
    recRef.current = rec;
    rec.lang = "en-GB";
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i];
        if (seg.isFinal) finalText += seg[0].transcript;
        else interim += seg[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onend = () => {
      setListening(false);
      const t = finalText.trim();
      if (t) { setInput(""); send(t); }
    };
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

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

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink />

      {/* En-tête façon Coach Emma : titre centré + ? */}
      <div className="text-center mt-2">
        <p className="font-mono text-[11px] uppercase tracking-wider text-amber font-semibold">Personalised coaching</p>
        <h1 className="font-serif font-black text-3xl text-indigo-deep">
          Coaching with Emma
          <button
            type="button"
            onClick={() => setHelpOpen((o) => !o)}
            className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-deep text-white text-[13px] font-sans align-middle hover:brightness-110"
            title="What is coaching for?"
          >?</button>
        </h1>
        <p className="text-muted text-sm mt-1">A Levels · exam craft, revision, timing, nerves — the competitor's side of the A*</p>
      </div>

      {helpOpen && (
        <div className="bg-indigo-soft rounded-xl px-4 py-3 text-[13.5px] text-indigo-deep mt-3">
          No maths here — coaching prepares <strong>the competitor</strong>: how exam day unfolds, what examiners reward,
          revision strategy, time management, nerves. Ask anything, out loud or in writing. Every session ends with a recap
          you can email home. Ideal length: 15-20 min.
        </div>
      )}

      {/* La carte Emma : elle est LÀ, tu écris ou tu parles */}
      <div className="card p-4 mt-4 flex items-center gap-4 flex-wrap">
        <EmmaFace state={speaking ? "speaking" : listening || busy ? "listening" : "idle"} size={64} />
        <div className="flex-1 min-w-[180px]">
          <p className="font-semibold text-[15.5px]">Emma, your coach</p>
          <p className="text-xs text-muted">on your side — out loud or in writing</p>
        </div>
        <button
          type="button"
          onClick={toggleMic}
          className={listening ? "btn-primary !py-2.5 !px-5 animate-pulse" : "btn-amber !py-2.5 !px-5"}
          title="Speak to Emma — your words are sent as your question"
        >
          {listening ? "🎙 Listening… tap to stop" : "🎙 Talk to Emma"}
        </button>
      </div>
      {micUnsupported && (
        <p className="text-xs text-gap font-semibold mt-1">Voice input isn&apos;t supported by this browser — type your question below instead.</p>
      )}

      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <EmmaStyle />
        <div className="flex items-center gap-2">
          {(voice.state === "playing" || voice.state === "paused") && (
            <button
              type="button"
              onClick={() => (speaking ? voice.pause() : voice.resume())}
              className="btn-ghost !py-1 !px-3 text-[12.5px]"
              title="Pause / resume Emma's voice"
            >
              {speaking ? "❚❚ Pause voice" : "▶ Resume voice"}
            </button>
          )}
          <button
            type="button"
            onClick={() => { if (voiceOn) voice.stop(); setVoiceOn(!voiceOn); }}
            className={voiceOn ? "btn-primary !py-1 !px-3 text-[12.5px]" : "btn-ghost !py-1 !px-3 text-[12.5px]"}
            title="Emma speaks her replies — the text stays as captions"
          >
            {voiceOn ? "🔊 Voice on" : "🔇 Voice off"}
          </button>
        </div>
      </div>

      {/* Le fil : Emma accueille D'EMBLÉE (comme Coach Emma), zéro attente */}
      <div className="card mt-3 p-5 min-h-[260px] max-h-[55vh] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[90%]">
              <p className="text-[15px]">
                Hi {firstName || "there"}! 👋 Ask me anything to move forward — or tell me what&apos;s worrying you about your
                exams and we&apos;ll work on it together.
              </p>
            </div>
          </div>
        )}
        {messages.length === 0 && !busy && (
          <div className="flex flex-wrap gap-2">
            {OPENERS.map((o) => (
              <button key={o} onClick={() => send(o)} className="btn-ghost !py-1.5 !px-3 text-[13px]">
                {o}
              </button>
            ))}
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
          placeholder="Write your question to Emma…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button className="btn-primary" disabled={busy || !input.trim()}>Send</button>
      </form>

      {/* Fin de séance — bouton central façon Coach Emma */}
      {messages.length > 1 && !wrap && (
        <div className="text-center mt-4">
          <button type="button" onClick={endSession} disabled={wrapBusy} className="btn-ghost !py-2.5 !px-6 !border-indigo-deep">
            {wrapBusy ? "Emma is writing your recap…" : "End the session & get my recap"}
          </button>
        </div>
      )}

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

      <p className="text-[11px] text-faint mt-3 text-center">
        Emma is a study coach, not a healthcare professional. If things really aren&apos;t okay, talk to your
        parents or a trusted adult.
      </p>
    </div>
  );
}
