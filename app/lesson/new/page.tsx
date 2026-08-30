"use client";

// Capture d'une leçon — les 3 portes d'entrée, une destination :
// titre, notes tapées, ou photo du cours → mêmes concepts identifiés.
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { compressImage } from "@/lib/compressImage";
import { SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";
import BackLink from "@/components/BackLink";
import EmmaStyle from "@/components/EmmaStyle";

export default function NewLessonPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <NewLesson />
    </Suspense>
  );
}

function NewLesson() {
  const router = useRouter();
  const search = useSearchParams();
  const preselect = search.get("subject");
  const [subject, setSubject] = useState<SubjectKey>(
    SUBJECT_KEYS.includes(preselect as SubjectKey) ? (preselect as SubjectKey) : "maths"
  );
  // Le board affiché sur chaque puce vient de l'inscription de l'élève.
  const [boards, setBoards] = useState<Record<string, string>>({});
  useEffect(() => {
    fetch("/api/enrolments")
      .then((r) => (r.ok ? r.json() : { enrolments: [] }))
      .then((d) => {
        const map: Record<string, string> = {};
        for (const e of d.enrolments || []) map[e.subject] = e.board;
        setBoards(map);
      })
      .catch(() => {});
  }, []);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clarify, setClarify] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setClarify(null);
    try {
      const fd = new FormData();
      fd.set("subject", subject);
      if (title.trim()) fd.set("title", title.trim());
      if (notes.trim()) fd.set("notes", notes.trim());
      if (photo) fd.set("photo", await compressImage(photo));
      const r = await fetch("/api/lessons", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.status === 422 && d.needs_clarification) {
        setClarify(d.clarification || "Could you say which chapter this is?");
        return;
      }
      if (!r.ok) throw new Error(d.error || "Something went wrong");
      router.push(`/lesson/${d.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <BackLink />
      <h1 className="font-serif font-black text-3xl text-indigo-deep mt-2">New lesson</h1>
      <p className="text-muted mt-2">
        Enter what you have — the title is enough, but the more you give, the closer the lesson will
        stick to what your teacher covered. Emma identifies the concepts from your exam board's specification.
      </p>

      {/* Choix de la matière — chaque matière porte son board et sa technique d'examen */}
      <div className="flex flex-wrap gap-2 mt-6">
        {Object.values(SUBJECTS).map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSubject(s.key)}
            className={
              subject === s.key
                ? "chip !text-[13px] !py-1.5 !px-4 bg-indigo text-white"
                : "chip !text-[13px] !py-1.5 !px-4 bg-white border border-line text-muted hover:text-indigo"
            }
            title={`${boards[s.key] || s.board} ${s.spec}`}
          >
            {s.labelEn} · {boards[s.key] || s.board}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card p-6 mt-4 space-y-5">
        <div>
          <label className="text-sm font-semibold">Lesson title</label>
          <input
            className="input mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={subject === "maths" ? "e.g. Differentiation — chain rule" : subject === "eco" ? "e.g. Price elasticity of demand" : subject === "geo" ? "e.g. Carbon cycle — human impacts" : "e.g. Paper 2 — La Haine, thème de la violence"}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Your notes <span className="text-faint font-normal">(optional)</span></label>
          <textarea
            className="input mt-1 min-h-[140px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste or type what you covered in class…"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Photo of the lesson <span className="text-faint font-normal">(optional)</span></label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 block w-full text-sm text-muted file:mr-3 file:btn-ghost file:!py-1.5 file:!px-3.5 file:text-[13px] file:border-0 file:bg-indigo-soft file:text-indigo file:rounded-lg file:font-semibold"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
          {photo && <p className="text-xs text-faint mt-1">{photo.name} ({Math.round(photo.size / 1024)} KB)</p>}
        </div>
        {clarify && (
          <p className="text-sm font-semibold text-learning bg-learning-bg rounded-xl px-4 py-3">
            Emma needs one more detail: {clarify}
          </p>
        )}
        {error && <p className="text-sm text-gap font-semibold">{error}</p>}
        <EmmaStyle />
        <button className="btn-primary w-full !py-3" disabled={busy}>
          {busy ? "Emma is identifying the concepts…" : "Let's go →"}
        </button>
      </form>
    </div>
  );
}
