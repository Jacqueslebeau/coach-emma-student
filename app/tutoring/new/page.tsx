"use client";

// NOUVEAU TUTORING — l'entrée unique, façon « Nouvelle préparation » de Coach
// Emma : choisis ta matière (les matières déjà configurées sont grisées), puis
// board → point de départ (GCSE ou test de niveau) → objectif → temps de
// préparation → « Generate my Tutoring Plan ».
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SUBJECTS, SUBJECT_KEYS, type SubjectKey } from "@/lib/subjects";
import SubjectSetup from "@/components/SubjectSetup";
import BackLink from "@/components/BackLink";

export default function NewTutoringPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <NewTutoring />
    </Suspense>
  );
}

function NewTutoring() {
  const router = useRouter();
  const search = useSearchParams();
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [subject, setSubject] = useState<SubjectKey | null>(null);

  useEffect(() => {
    fetch("/api/enrolments")
      .then((r) => (r.ok ? r.json() : { enrolments: [] }))
      .then((d) => setEnrolled(new Set((d.enrolments || []).map((e: { subject: string }) => e.subject))))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Pré-sélection éventuelle (?subject=eco) — seulement si pas déjà configurée.
  useEffect(() => {
    const pre = search.get("subject");
    if (loaded && pre && SUBJECT_KEYS.includes(pre as SubjectKey) && !enrolled.has(pre)) {
      setSubject(pre as SubjectKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return (
    <div className="max-w-3xl mx-auto">
      <BackLink />
      <h1 className="font-serif font-black text-3xl text-indigo-deep mt-2">New tutoring</h1>
      <p className="text-muted mt-2">
        Pick a subject — Emma finds your real starting point, you set the goal, and she writes your
        <span className="font-semibold text-ink"> Tutoring Plan</span>, sized to the time you have.
      </p>

      {!subject && (
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {SUBJECT_KEYS.map((k) => {
          const s = SUBJECTS[k];
          const taken = enrolled.has(k);
          const active = subject === k;
          return (
            <button
              key={k}
              type="button"
              disabled={taken}
              onClick={() => setSubject(k)}
              className={
                taken
                  ? "card p-4 text-left opacity-45 cursor-not-allowed"
                  : active
                    ? "card p-4 text-left border-indigo ring-1 ring-indigo/30"
                    : "card p-4 text-left hover:border-indigo transition"
              }
            >
              <span className="font-serif font-semibold text-lg">{s.labelEn}</span>
              {taken ? (
                <span className="block text-xs text-faint mt-1">Already set up — see it in <span className="underline">My tutorings</span></span>
              ) : (
                <span className="block text-xs text-muted mt-1">{k === "french" ? "Private candidate" : "A Level"}</span>
              )}
            </button>
          );
        })}
      </div>
      )}

      {subject && (
        <button type="button" onClick={() => setSubject(null)} className="text-sm text-faint hover:text-indigo font-semibold mt-4">
          ← Choose another subject
        </button>
      )}

      {subject && (
        <SubjectSetup
          subject={subject}
          subjectLabel={SUBJECTS[subject].labelEn}
          onDone={() => router.push(`/matiere/${subject}`)}
        />
      )}

      {loaded && enrolled.size === SUBJECT_KEYS.length && (
        <p className="text-sm text-muted mt-5">
          All your subjects are set up — head back to <Link href="/dashboard" className="text-indigo font-semibold">My space</Link>.
        </p>
      )}
    </div>
  );
}
