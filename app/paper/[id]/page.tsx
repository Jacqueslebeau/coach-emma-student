"use client";

// LA CONSOLE D'UN PAST PAPER — le pivot du format « leçon → paper → débrief » :
// - À FAIRE : répondre EN LIGNE ici même, ou IMPRIMER le paper, le faire sur
//   papier et uploader la photo de sa copie — puis envoi à la correction.
// - CORRIGÉ : la review complète (marks, feedback, mark scheme), puis le
//   DÉBRIEF COACHÉ avec Emma (écrit ou vocal) sur CETTE copie, et la
//   variation ciblée si besoin. Tout est centralisé et enregistré.
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichText from "@/components/RichText";
import BackLink from "@/components/BackLink";
import VoiceTalk from "@/components/VoiceTalk";
import { compressImage } from "@/lib/compressImage";
import type { Exercise, ExerciseMark } from "@/lib/types";

type Data = {
  attempt: { id: string; lesson_id: string; payload: { exercises?: Exercise[]; variant?: boolean; answers?: { id: string; answer: string }[] }; result: (ExerciseMark & { photos?: string[] }) | null; created_at: string };
  lesson: { id: string; title: string; subject: string; exam_board: string | null; spec_topic: string | null } | null;
  first_name: string;
};
type QA = { id?: string; question: string; answer: string };

const DEBRIEF_OPENERS = [
  "Where did I lose most marks?",
  "Walk me through my worst question",
  "What should I do differently next time?",
];

export default function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [marking, setMarking] = useState(false);
  const [markErr, setMarkErr] = useState<string | null>(null);
  const [variantBusy, setVariantBusy] = useState(false);
  // Débrief écrit
  const [qas, setQas] = useState<QA[]>([]);
  const [dInput, setDInput] = useState("");
  const [dBusy, setDBusy] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/attempts/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Paper not found"))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);
  useEffect(load, [load]);

  // Historique du débrief (persisté — on peut y revenir).
  useEffect(() => {
    fetch(`/api/paper/${id}/coach`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setQas(d.messages || []))
      .catch(() => {});
  }, [id]);

  async function submitForMarking() {
    if (!data?.lesson) return;
    setMarking(true); setMarkErr(null);
    try {
      const fd = new FormData();
      fd.set("attempt_id", id);
      fd.set("answers", JSON.stringify((data.attempt.payload.exercises || []).map((e) => ({ id: e.id, answer: answers[e.id] || "" }))));
      const compressed = await Promise.all(photos.map(compressImage));
      compressed.forEach((p) => fd.append("photos", p));
      const r = await fetch(`/api/lessons/${data.lesson.id}/mark`, { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Marking failed — try again.");
      load();
      window.scrollTo(0, 0);
    } catch (e) {
      setMarkErr((e as Error).message);
    } finally {
      setMarking(false);
    }
  }

  async function askDebrief(text: string) {
    const q = text.trim();
    if (!q || dBusy) return;
    setDBusy(true); setDInput("");
    try {
      const r = await fetch(`/api/paper/${id}/coach`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Emma could not answer");
      setQas((x) => [...x, { question: q, answer: d.answer }]);
    } catch (e) {
      setMarkErr((e as Error).message);
      setDInput(q);
    } finally {
      setDBusy(false);
    }
  }

  async function doVariation() {
    if (!data?.lesson || !data.attempt.result) return;
    setVariantBusy(true);
    try {
      const r = await fetch(`/api/lessons/${data.lesson.id}/exercises`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ concept_keys: data.attempt.result.redo_concept_keys || [], variant: true }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not build the variation");
      router.push(`/paper/${d.attempt_id}`);
    } catch (e) {
      setMarkErr((e as Error).message);
      setVariantBusy(false);
    }
  }

  async function saveToDrive() {
    setDriveBusy(true); setDriveMsg(null);
    try {
      const r = await fetch("/api/google/save-paper", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attempt_id: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 428 || d.error === "not_connected") setDriveMsg("Connect your Google Drive first — My account → Integrations.");
      else if (r.status === 503) setDriveMsg("Google Drive integration is coming very soon.");
      else if (!r.ok) throw new Error(d.error || "Drive save failed");
      else setDriveLink(d.link);
    } catch (e) {
      setDriveMsg((e as Error).message);
    } finally {
      setDriveBusy(false);
    }
  }

  if (err) return <p className="text-gap font-semibold">{err}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;

  const exercises = data.attempt.payload?.exercises || [];
  const mark = data.attempt.result;
  const totalMarks = exercises.reduce((s, e) => s + (e.marks || 0), 0);
  const awarded = mark ? mark.items.reduce((s, i) => s + (i.marks_awarded || 0), 0) : null;
  const when = new Date(data.attempt.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <BackLink />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.print()} className="btn-ghost !py-2 !px-4 text-[13.5px]">
            🖨️ Print the blank paper
          </button>
          {mark && (
            driveLink || (mark as { drive_link?: string }).drive_link ? (
              <a href={driveLink || (mark as { drive_link?: string }).drive_link} target="_blank" rel="noreferrer" className="btn-ghost !py-2 !px-4 text-[13.5px]">
                📁 Open in Google Drive
              </a>
            ) : (
              <button onClick={saveToDrive} disabled={driveBusy} className="btn-ghost !py-2 !px-4 text-[13.5px]">
                {driveBusy ? "Saving…" : "📁 Save to Google Drive"}
              </button>
            )
          )}
        </div>
      </div>
      {driveMsg && <p className="no-print text-sm text-learning font-semibold mt-2">{driveMsg}</p>}

      {/* Mode d'emploi (paper à faire) */}
      {!mark && (
        <div className="no-print rounded-xl bg-indigo-soft px-4 py-2.5 text-[13.5px] text-indigo-deep mt-3">
          📝 <strong>Your past paper.</strong> Do it <strong>online below</strong> — or <strong>print it</strong>, do it on paper
          under timed conditions, then <strong>upload a photo of your script</strong> at the bottom. Emma marks it against the
          mark scheme either way, then debriefs it with you.
        </div>
      )}

      {/* ============ EN-TÊTE FAÇON PAPER ============ */}
      <div className="card p-6 mt-4 paper-sheet">
        <div className="border-b-2 border-ink pb-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
            {data.lesson?.exam_board || "A Level"} · practice paper · {when}
          </p>
          <h1 className="font-serif font-black text-2xl text-indigo-deep mt-1">{data.lesson?.title || "Practice paper"}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted">
            {data.lesson?.spec_topic && <span>{data.lesson.spec_topic}</span>}
            <span><strong>{totalMarks} marks</strong> · ~{exercises.reduce((s, e) => s + (e.time_min || e.marks || 0), 0)} min — time yourself</span>
            {data.attempt.payload?.variant && <span className="no-print">targeted variation</span>}
          </div>
          <p className="print-only text-sm mt-3">
            Name: ______________________________ &nbsp;&nbsp; Date: ______________ &nbsp;&nbsp; Time yourself. Show every step of your working.
          </p>
        </div>

        {/* ============ LES QUESTIONS (+ réponse en ligne si non corrigé) ============ */}
        {exercises.map((e, i) => (
          <div key={e.id} className="mt-6 paper-q">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif font-black text-lg">{i + 1}.</span>
              {e.command_word && <span className="chip bg-amber-soft text-amber font-mono no-print">“{e.command_word}”</span>}
              <span className="font-mono text-[12px] text-faint">[{e.marks} marks{e.time_min ? ` · ~${e.time_min} min` : ""}]</span>
            </div>
            <RichText text={e.statement} className="mt-2 text-[15px]" />
            {e.exam_expectation && (
              <p className="no-print text-[12.5px] text-muted mt-2 bg-indigo-soft rounded-lg px-3 py-2">
                🎯 <strong>What the examiner expects:</strong> {e.exam_expectation}
              </p>
            )}
            {!mark && (
              <textarea
                className="no-print input mt-3 min-h-[90px] font-mono text-[14px]"
                placeholder="Your answer here… (or leave blank if you're uploading a photo of your script)"
                value={answers[e.id] || ""}
                onChange={(ev) => setAnswers((a) => ({ ...a, [e.id]: ev.target.value }))}
              />
            )}
            <div className="print-only answer-space" />
          </div>
        ))}
      </div>

      {/* ============ ENVOI À LA CORRECTION (paper à faire) ============ */}
      {!mark && (
        <div className="no-print mt-4 space-y-3">
          <div className="card p-5">
            <label className="text-sm font-semibold">📷 Photo(s) of your handwritten script <span className="text-faint font-normal">(up to 3 — if you did it on paper)</span></label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="mt-2 block w-full text-sm text-muted"
              onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 3))}
            />
            {photos.length > 0 && <p className="text-xs text-faint mt-1">{photos.map((p) => p.name).join(" · ")}</p>}
          </div>
          {markErr && <p className="text-sm text-gap font-semibold">{markErr}</p>}
          <button onClick={submitForMarking} disabled={marking} className="btn-primary w-full !py-3">
            {marking ? "Emma is marking your paper against the mark scheme…" : "Send for marking →"}
          </button>
        </div>
      )}

      {/* ============ LA REVIEW + LE DÉBRIEF (paper corrigé) ============ */}
      {mark && (
        <div className="no-print mt-6 space-y-4">
          <div className="card p-5 bg-indigo-soft border-indigo-soft flex items-center justify-between flex-wrap gap-3">
            <p className="font-semibold text-indigo-deep">{mark.summary}</p>
            <p className="font-serif font-black text-3xl text-indigo shrink-0">{awarded}<span className="text-lg">/{totalMarks}</span></p>
          </div>
          {exercises.map((e, i) => {
            const it = mark.items.find((x) => x.id === e.id);
            if (!it) return null;
            const tone = it.verdict === "secure" ? "chip-acquis" : it.verdict === "fragile" ? "chip-fragile" : "chip-non_acquis";
            return (
              <div key={e.id} className="card p-5">
                <div className="flex items-center gap-2">
                  <span className={tone}>{it.marks_awarded}/{it.marks_total} marks</span>
                  <p className="font-mono text-[11px] text-faint">Question {i + 1}</p>
                </div>
                <RichText text={it.feedback} className="mt-2" />
                <p className="text-sm text-muted mt-2"><strong>Method marks:</strong> {it.method_comment}</p>
                {it.misconception && <p className="text-sm text-gap font-semibold mt-1">Misconception spotted: {it.misconception}</p>}
                <details className="mt-2">
                  <summary className="text-sm font-semibold text-indigo cursor-pointer">Step-by-step solution (mark scheme)</summary>
                  <RichText text={it.model_solution} className="mt-2" />
                </details>
              </div>
            );
          })}

          {/* ============ LE DÉBRIEF COACHÉ — le cœur du cycle ============ */}
          <div className="card p-5 border-indigo">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-serif font-semibold text-lg">🎯 Debrief this paper with Emma</h2>
                <p className="text-sm text-muted mt-0.5">What went well, where the marks went, what to do differently — in conversation.</p>
              </div>
              <VoiceTalk mode="paper" paperId={id} label="🎙 Debrief out loud" />
            </div>

            {qas.length > 0 && (
              <div className="mt-4 space-y-3">
                {qas.map((qa, i) => (
                  <div key={qa.id || i} className="space-y-2">
                    <div className="flex justify-end">
                      <p className="bg-indigo text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%] text-[14px]">{qa.question}</p>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-indigo-soft rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[92%]">
                        <RichText text={qa.answer} className="text-[14px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {qas.length === 0 && !dBusy && (
              <div className="flex flex-wrap gap-2 mt-3">
                {DEBRIEF_OPENERS.map((o) => (
                  <button key={o} onClick={() => askDebrief(o)} className="btn-ghost !py-1.5 !px-3 text-[13px]">{o}</button>
                ))}
              </div>
            )}
            {dBusy && <p className="text-sm text-faint mt-3">Emma is looking at your paper…</p>}
            <form onSubmit={(e) => { e.preventDefault(); askDebrief(dInput); }} className="mt-3 flex gap-2">
              <input
                className="input flex-1 !py-2"
                placeholder="Ask Emma about this paper…"
                value={dInput}
                onChange={(e) => setDInput(e.target.value)}
                disabled={dBusy}
              />
              <button className="btn-primary !py-2 !px-4 text-[13.5px]" disabled={dBusy || !dInput.trim()}>Send</button>
            </form>
          </div>

          {/* ============ LA SUITE DU CYCLE ============ */}
          <div className="flex flex-wrap gap-3">
            {mark.decision === "redo" ? (
              <button onClick={doVariation} disabled={variantBusy} className="btn-amber !py-2.5">
                {variantBusy ? "Emma is preparing the variation…" : "📝 Do a variation paper (same skills, new questions)"}
              </button>
            ) : (
              <button onClick={doVariation} disabled={variantBusy} className="btn-ghost">
                {variantBusy ? "Preparing…" : "One more paper to be sure"}
              </button>
            )}
            {data.lesson && <Link href={`/matiere/${data.lesson.subject}`} className="btn-ghost">Back to {data.lesson.subject === "maths" ? "Mathematics" : "the subject"} →</Link>}
          </div>
        </div>
      )}

      <style>{`
        .print-only{display:none}
        @media print {
          header, footer, .no-print { display:none !important }
          .print-only{display:block}
          .paper-sheet{border:none !important;box-shadow:none !important;padding:0 !important}
          .answer-space{height:180px;border-bottom:1px solid #bbb;margin-top:14px;background:repeating-linear-gradient(transparent,transparent 27px,#ddd 28px)}
          .paper-q{page-break-inside:avoid}
          main{padding:0 !important;max-width:100% !important}
        }
      `}</style>
    </div>
  );
}
