"use client";

// SET-UP D'UNE MATIÈRE, dans sa console — la plateforme démarre VIERGE :
// board → « as-tu passé le GCSE dans cette matière ? » → oui : note (+ relevé
// uploadable, lu par Emma) / non : TEST DE NIVEAU (8 questions corrigées par
// Emma) → objectif borné → session d'examen → plan de travail dimensionné
// sur le temps restant.
import { useRef, useState } from "react";
import { BOARD_OPTIONS, type SubjectKey } from "@/lib/subjects";
import { GCSE_GRADES, gcseToStart, allowedTargets } from "@/lib/grades";

type Q = { id: string; question: string; marks?: number; tariff?: string };
type PlacementResult = { total_awarded: number; total: number; estimated_start: string; rationale: string };

export default function SubjectSetup({ subject, subjectLabel, onDone }: {
  subject: SubjectKey; subjectLabel: string; onDone: () => void;
}) {
  const opts = BOARD_OPTIONS[subject];
  const [board, setBoard] = useState<string>(opts[0].board);
  const [tookGcse, setTookGcse] = useState<boolean | null>(null);
  const [gcse, setGcse] = useState("");
  const [gcseNote, setGcseNote] = useState("");
  const [mathsGcse, setMathsGcse] = useState("");
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [intro, setIntro] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [placement, setPlacement] = useState<PlacementResult | null>(null);
  const [target, setTarget] = useState("A*");
  const [examDate, setExamDate] = useState("");
  const [prepChoice, setPrepChoice] = useState(""); // "1"|"2"|"3"|"6"|"9"|"12" mois, ou "date"
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Point de départ : note GCSE projetée, ou résultat du test de niveau.
  const start = tookGcse ? (gcse ? gcseToStart(gcse) : null) : placement?.estimated_start || null;
  const targets = allowedTargets(start) as string[];
  const safeTarget = targets.includes(target) ? target : targets[0];

  async function readSlip(file: File) {
    setBusy("slip"); setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(",")[1] || "");
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const r = await fetch("/api/gcse-extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: b64, media_type: file.type || "image/jpeg" }),
      });
      const d = await r.json();
      if (!r.ok || !d.readable) throw new Error(d.error || d.reason || "Emma couldn't read this document — enter your grade manually.");
      const mine = (d.results || []).find((x: { subject: string }) => x.subject === subject);
      if (mine?.grade) { setGcse(String(mine.grade)); setGcseNote(mine.detail || ""); }
      else setError(`No ${subjectLabel} grade found on this slip — enter it manually.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function startPlacement() {
    setBusy("placement-start"); setError(null);
    try {
      const r = await fetch("/api/placement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start", subject, board, maths_gcse: mathsGcse || null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not build the level check");
      setQuestions(d.questions); setIntro(d.intro || "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function gradePlacement() {
    if (!questions) return;
    setBusy("placement-grade"); setError(null);
    try {
      const r = await fetch("/api/placement", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "grade", subject, board, questions,
          answers: questions.map((q) => ({ id: q.id, answer: answers[q.id] || "" })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not mark the level check");
      setPlacement(d);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save"); setError(null);
    try {
      const r = await fetch("/api/enrolments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enrolments: [{
            subject,
            board,
            gcse_grade: tookGcse ? gcse || null : null,
            gcse_note: tookGcse
              ? gcseNote || null
              : placement
                ? `Level check: ${placement.total_awarded}/${placement.total} — ${placement.rationale}`.slice(0, 300)
                : null,
            current_grade: tookGcse ? null : placement?.estimated_start || null,
            target_grade: safeTarget,
            exam_date: examDate || null,
          }],
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not save");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const readyToSave = Boolean(start && examDate);

  return (
    <div className="card p-6 mt-5 border-indigo">
      <h2 className="font-serif font-semibold text-xl text-indigo-deep">Set up {subjectLabel}</h2>
      <p className="text-sm text-muted mt-1">
        Your exam board, your real starting point, your target — then Emma writes your work plan,
        sized to the time you actually have.
      </p>

      {/* 1 · Board */}
      <label className="block text-sm font-semibold mt-4">
        Exam board
        <select className="input mt-1 !py-1.5 max-w-xs" value={board} onChange={(e) => setBoard(e.target.value)}>
          {opts.map((o) => <option key={o.board} value={o.board}>{o.label} · {o.spec}</option>)}
        </select>
      </label>

      {/* 2 · GCSE ou test de niveau */}
      <div className="mt-4">
        <p className="text-sm font-semibold">Did you sit a GCSE in {subjectLabel}?</p>
        <div className="flex gap-2 mt-1.5">
          <button type="button" onClick={() => { setTookGcse(true); setPlacement(null); setQuestions(null); }}
            className={tookGcse === true ? "btn-primary !py-1.5 !px-4" : "chip bg-white border border-line !py-1.5 !px-4 hover:text-indigo"}>
            Yes
          </button>
          <button type="button" onClick={() => { setTookGcse(false); setGcse(""); setGcseNote(""); }}
            className={tookGcse === false ? "btn-primary !py-1.5 !px-4" : "chip bg-white border border-line !py-1.5 !px-4 hover:text-indigo"}>
            No — check my level
          </button>
        </div>
      </div>

      {tookGcse === true && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold">
            Your GCSE grade
            <select className="input mt-1 !py-1.5 max-w-[120px]" value={gcse} onChange={(e) => setGcse(e.target.value)}>
              <option value="">—</option>
              {GCSE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <div className="text-sm">
            <p className="font-semibold">Optional — upload your results slip</p>
            <p className="text-xs text-muted">Emma reads the exact grade and the marks behind it (a high 7 and a low 7 don&apos;t start from the same place).</p>
            <input ref={fileRef} type="file" accept="image/*" className="text-sm mt-1.5"
              onChange={(e) => e.target.files?.[0] && readSlip(e.target.files[0])} disabled={busy === "slip"} />
            {busy === "slip" && <p className="text-xs text-muted animate-pulse mt-1">Emma is reading your slip…</p>}
            {gcseNote && <p className="text-xs text-indigo-deep font-semibold mt-1">From your slip: {gcseNote}</p>}
          </div>
          {gcse && (
            <p className="text-sm text-muted">
              Projected A Level starting point: <span className="font-semibold text-ink">{gcseToStart(gcse)}</span>
            </p>
          )}
        </div>
      )}

      {tookGcse === false && !placement && (
        <div className="mt-4">
          {!questions ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                No GCSE in this subject (that&apos;s normal — most students haven&apos;t). Emma gives you a
                short <span className="font-semibold text-ink">level check</span> (~10 min, 8 quick questions)
                to find your real starting point. No trick questions.
              </p>
              <label className="block text-sm font-semibold">
                Your GCSE Maths grade (optional — helps Emma calibrate)
                <select className="input mt-1 !py-1.5 max-w-[120px]" value={mathsGcse} onChange={(e) => setMathsGcse(e.target.value)}>
                  <option value="">—</option>
                  {GCSE_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <button type="button" onClick={startPlacement} disabled={busy === "placement-start"} className="btn-amber !py-2 !px-4">
                {busy === "placement-start" ? "Emma is preparing your check…" : "Start the level check →"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {intro && <p className="text-sm text-indigo-deep font-semibold">{intro}</p>}
              {questions.map((q, i) => (
                <div key={q.id}>
                  <p className="text-sm font-semibold">
                    {i + 1}. {q.question} <span className="font-mono text-[11px] text-faint font-normal">[{q.marks ?? 1} mark{(q.marks ?? 1) > 1 ? "s" : ""}]</span>
                  </p>
                  <textarea rows={2} className="input mt-1 w-full text-sm"
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
                </div>
              ))}
              <button type="button" onClick={gradePlacement} disabled={busy === "placement-grade"} className="btn-primary !py-2 !px-4">
                {busy === "placement-grade" ? "Emma is marking…" : "Submit my answers"}
              </button>
            </div>
          )}
        </div>
      )}

      {placement && (
        <div className="bg-indigo-soft rounded-xl px-4 py-3 mt-4">
          <p className="text-sm font-semibold text-indigo">
            Level check: {placement.total_awarded}/{placement.total} — starting point <span className="font-serif font-black text-lg">{placement.estimated_start}</span>
          </p>
          <p className="text-sm text-muted mt-1">{placement.rationale}</p>
        </div>
      )}

      {/* 3 · Objectif + session */}
      {start && (
        <div className="grid sm:grid-cols-2 gap-4 mt-5 max-w-md">
          <label className="text-sm font-semibold">
            A Level target
            <select className="input mt-1 !py-1.5" value={safeTarget} onChange={(e) => setTarget(e.target.value)}>
              {targets.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <span className="block text-[11px] text-faint font-normal mt-0.5">Can&apos;t be below where you already are.</span>
          </label>
          <label className="text-sm font-semibold">
            How long do you have to prepare?
            <select
              className="input mt-1 !py-1.5"
              value={prepChoice}
              onChange={(e) => {
                const v = e.target.value;
                setPrepChoice(v);
                if (v && v !== "date") {
                  const d = new Date();
                  d.setMonth(d.getMonth() + Number(v));
                  setExamDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                }
              }}
            >
              <option value="">—</option>
              <option value="1">1 month</option>
              <option value="2">2 months</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">A year or more</option>
              <option value="date">I know my exam session</option>
            </select>
            <span className="block text-[11px] text-faint font-normal mt-0.5">The plan is sized to the time you actually have.</span>
          </label>
          {prepChoice === "date" && (
            <label className="text-sm font-semibold">
              Exam session
              <input type="month" className="input mt-1 !py-1.5" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </label>
          )}
        </div>
      )}

      {error && <p className="text-sm text-gap font-semibold mt-3">{error}</p>}
      {readyToSave && (
        <button type="button" onClick={save} disabled={busy === "save"} className="btn-primary w-full !py-3 mt-5">
          {busy === "save" ? "Generating…" : "Generate my Tutoring Plan →"}
        </button>
      )}
    </div>
  );
}
