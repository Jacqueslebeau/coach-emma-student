"use client";

// UN PAST PAPER, centralisé dans la console (principe Interview Live) :
// - version EXAMEN imprimable/téléchargeable en PDF (bouton Print → Save as
//   PDF) pour le faire sur papier ;
// - ou le faire EN LIGNE dans la leçon ;
// - et une fois corrigé : la review complète — score, feedback mark par mark,
//   mark scheme — retrouvable à tout moment depuis la page matière.
import { use, useEffect, useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import BackLink from "@/components/BackLink";
import type { Exercise, ExerciseMark } from "@/lib/types";

type Data = {
  attempt: { id: string; lesson_id: string; payload: { exercises?: Exercise[]; variant?: boolean }; result: (ExerciseMark & { photos?: string[] }) | null; created_at: string };
  lesson: { id: string; title: string; subject: string; exam_board: string | null; spec_topic: string | null } | null;
  first_name: string;
};

export default function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  async function saveToDrive() {
    setDriveBusy(true); setDriveMsg(null);
    try {
      const r = await fetch("/api/google/save-paper", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attempt_id: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 428 || d.error === "not_connected") {
        setDriveMsg("Connect your Google Drive first — from the dashboard, Integrations section.");
      } else if (r.status === 503) {
        setDriveMsg("Google Drive integration is coming very soon.");
      } else if (!r.ok) {
        throw new Error(d.error || "Drive save failed");
      } else {
        setDriveLink(d.link);
      }
    } catch (e) {
      setDriveMsg((e as Error).message);
    } finally {
      setDriveBusy(false);
    }
  }

  useEffect(() => {
    fetch(`/api/attempts/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Paper not found"))))
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [id]);

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
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-ghost !py-2 !px-4 text-[13.5px]">
            🖨️ Download / print the blank paper
          </button>
          {data?.attempt.result && (
            driveLink || (data.attempt.result as { drive_link?: string }).drive_link ? (
              <a href={driveLink || (data.attempt.result as { drive_link?: string }).drive_link} target="_blank" rel="noreferrer" className="btn-ghost !py-2 !px-4 text-[13.5px]">
                📁 Open in Google Drive
              </a>
            ) : (
              <button onClick={saveToDrive} disabled={driveBusy} className="btn-ghost !py-2 !px-4 text-[13.5px]">
                {driveBusy ? "Saving…" : "📁 Save to Google Drive"}
              </button>
            )
          )}
          {!mark && data.lesson && (
            <Link href={`/lesson/${data.lesson.id}`} className="btn-primary !py-2 !px-4 text-[13.5px]">
              Answer online →
            </Link>
          )}
        </div>
      </div>

      {driveMsg && <p className="no-print text-sm text-learning font-semibold mt-2">{driveMsg}</p>}

      {/* ============ EN-TÊTE FAÇON PAPER ============ */}
      <div className="card p-6 mt-4 paper-sheet">
        <div className="border-b-2 border-ink pb-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
            {data.lesson?.exam_board || "A Level"} · practice paper · {when}
          </p>
          <h1 className="font-serif font-black text-2xl text-indigo-deep mt-1">{data.lesson?.title || "Practice paper"}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted">
            {data.lesson?.spec_topic && <span>{data.lesson.spec_topic}</span>}
            <span><strong>{totalMarks} marks</strong> · ~{exercises.reduce((s, e) => s + (e.time_min || e.marks || 0), 0)} min</span>
            {data.attempt.payload?.variant && <span className="no-print">targeted variation</span>}
          </div>
          <p className="print-only text-sm mt-3">
            Name: ______________________________ &nbsp;&nbsp; Date: ______________ &nbsp;&nbsp; Time yourself. Show every step of your working.
          </p>
        </div>

        {/* ============ LES QUESTIONS ============ */}
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
            {/* Espace de rédaction — uniquement sur la version imprimée */}
            <div className="print-only answer-space" />
          </div>
        ))}
      </div>

      {/* ============ LA REVIEW (si corrigé) ============ */}
      {mark ? (
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
          {data.lesson && (
            <Link href={`/lesson/${data.lesson.id}`} className="btn-ghost inline-block">Back to the lesson →</Link>
          )}
        </div>
      ) : (
        <p className="no-print text-sm text-muted mt-4">
          Not marked yet — do it on paper (print above) then upload your script from the lesson, or answer online.
        </p>
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
