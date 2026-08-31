// Le résumé d'une copie corrigée (past paper) donné à Emma pour le débrief :
// questions, réponses de l'élève, marks, feedback examinateur, mark scheme.
import type { Exercise, ExerciseMark } from "@/lib/types";

export function paperContext(attempt: { payload: unknown; result: unknown }): string {
  const exercises = ((attempt.payload as { exercises?: Exercise[] })?.exercises || []) as Exercise[];
  const answers = ((attempt.payload as { answers?: { id: string; answer: string }[] })?.answers || []);
  const mark = attempt.result as (ExerciseMark & { photos?: string[] }) | null;
  const lines = exercises.map((e, i) => {
    const a = answers.find((x) => x.id === e.id)?.answer?.trim();
    const it = mark?.items?.find((x) => x.id === e.id);
    return (
      `Q${i + 1} [${e.marks} marks] ${e.statement.slice(0, 400)}\n` +
      (a ? `STUDENT'S ANSWER: ${a.slice(0, 500)}\n` : "STUDENT'S ANSWER: (handwritten — see marking feedback)\n") +
      (it
        ? `MARKS: ${it.marks_awarded}/${it.marks_total} · VERDICT: ${it.verdict}\nEXAMINER FEEDBACK: ${(it.feedback || "").slice(0, 500)}\nMETHOD: ${(it.method_comment || "").slice(0, 250)}\nMARK SCHEME SOLUTION: ${(it.model_solution || "").slice(0, 500)}`
        : "Not marked.")
    );
  });
  const total = mark?.items?.reduce((s, i) => s + (i.marks_total || 0), 0) || 0;
  const got = mark?.items?.reduce((s, i) => s + (i.marks_awarded || 0), 0) || 0;
  return `SCORE: ${got}/${total} · DECISION: ${mark?.decision || "—"}\nSUMMARY: ${(mark?.summary || "").slice(0, 300)}\n\n${lines.join("\n\n")}`.slice(0, 9000);
}
