"use client";

// 🎙 LA CONVERSATION VOCALE TEMPS RÉEL AVEC EMMA — même mécanisme que Coach
// Emma : agent conversationnel ElevenLabs (WebSocket). Emma ENTEND l'élève et
// répond de vive voix, en continu. Utilisé par le coaching (coach d'examen)
// et par la leçon (tutrice ancrée sur la leçon en cours).
// Le transcript est flushé dans /api/voice-log à la fin (historique + récaps).
import { useCallback, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import EmmaFace from "@/components/EmmaFace";

type Line = { role: "user" | "assistant"; message: string };

export default function VoiceTalk({ mode, lessonId, label = "🎙 Talk to Emma", onLine }: {
  mode: "coaching" | "lesson";
  lessonId?: string;
  label?: string;
  onLine?: (line: Line) => void; // le parent peut refléter le transcript dans son fil
}) {
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastLines, setLastLines] = useState<Line[]>([]);
  const bufferRef = useRef<Line[]>([]);
  const flushedRef = useRef(false);

  const flush = useCallback(() => {
    if (flushedRef.current || bufferRef.current.length === 0) return;
    flushedRef.current = true;
    const lines = bufferRef.current;
    bufferRef.current = [];
    fetch("/api/voice-log", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, lesson_id: lessonId, lines }),
    }).catch(() => {});
  }, [mode, lessonId]);

  const conversation = useConversation({
    onConnect: () => setPhase("live"),
    onDisconnect: () => { setPhase("idle"); flush(); },
    onError: () => { setPhase("error"); setError("Voice connection lost — try again."); flush(); },
    onMessage: (m: { source?: string; message?: string }) => {
      const text = (m?.message ?? "").toString().trim();
      if (!text) return;
      const line: Line = { role: m?.source === "user" ? "user" : "assistant", message: text };
      bufferRef.current = [...bufferRef.current, line];
      setLastLines((p) => [...p.slice(-3), line]);
      onLine?.(line);
    },
  });

  async function start() {
    setPhase("connecting"); setError(null);
    flushedRef.current = false;
    setLastLines([]);
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch {
      setPhase("error"); setError("Microphone access was refused — allow it and try again."); return;
    }
    try {
      const r = await fetch("/api/voice-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, lesson_id: lessonId }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.signed_url) throw new Error(d.error || "Voice is unavailable right now.");
      await conversation.startSession({
        signedUrl: d.signed_url,
        connectionType: "websocket",
        dynamicVariables: d.vars || {},
      });
    } catch (e) {
      setPhase("error");
      setError((e as Error).message);
    }
  }

  async function stop() {
    try { await conversation.endSession(); } catch {}
    setPhase("idle");
    flush();
  }

  if (phase === "idle" || phase === "connecting" || phase === "error") {
    return (
      <div className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={start}
          disabled={phase === "connecting"}
          className="btn-amber !py-2.5 !px-5 disabled:opacity-60"
          title="A real voice conversation — Emma hears you and answers"
        >
          {phase === "connecting" ? "🎙 Connecting…" : label}
        </button>
        {phase === "error" && error && <p className="text-xs text-gap font-semibold max-w-[260px] text-right">{error}</p>}
      </div>
    );
  }

  // EN DIRECT — Emma écoute / parle.
  const speaking = (conversation as { isSpeaking?: boolean }).isSpeaking === true;
  return (
    <div className="w-full card p-4 border-indigo bg-indigo-soft/30">
      <div className="flex items-center gap-3 flex-wrap">
        <EmmaFace state={speaking ? "speaking" : "listening"} size={56} />
        <div className="flex-1 min-w-[160px]">
          <p className="font-semibold text-[14.5px]">{speaking ? "Emma is speaking…" : "Emma is listening — go ahead 🎙"}</p>
          <p className="text-xs text-muted">A real conversation: speak naturally, she hears you.</p>
        </div>
        <button type="button" onClick={stop} className="btn-primary !py-2 !px-4 text-[13.5px]">⏹ End the voice chat</button>
      </div>
      {lastLines.length > 0 && (
        <div className="mt-3 space-y-1">
          {lastLines.slice(-3).map((l, i) => (
            <p key={i} className={`text-[13px] ${l.role === "user" ? "text-ink" : "text-indigo-deep"}`}>
              <span className="font-semibold">{l.role === "user" ? "You: " : "Emma: "}</span>{l.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
