// TEST DE NIVEAU — pour les matières sans note GCSE : 8 questions calibrées
// board (action "start"), puis correction + estimation du point de départ
// (action "grade"). Le résultat devient le niveau actuel de l'inscription.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { askClaude, extractJson } from "@/lib/claude";
import { placementSystem, placementGradeSystem } from "@/lib/prompts";
import { getSubjectBoard } from "@/lib/subjects";
import type { QuizQuestion } from "@/lib/types";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "start");
  const subj = getSubjectBoard(String(body?.subject || ""), String(body?.board || "") || null, auth.contentLang);

  try {
    if (action === "start") {
      const mathsGcse = String(body?.maths_gcse || "").slice(0, 4) || null;
      const parsed = extractJson<{ intro: string; questions: QuizQuestion[] }>(
        await askClaude({
          system: placementSystem(auth.firstName, auth.style, subj, mathsGcse),
          content: `Écris le test de niveau (8 questions).`,
          maxTokens: 3000,
          effort: "medium",
          workflow: "placement-start",
          userId: auth.user.id,
          sb: auth.sb,
        })
      );
      if (!parsed.questions?.length) throw new Error("test vide");
      return NextResponse.json(parsed);
    }

    if (action === "grade") {
      const questions = (Array.isArray(body?.questions) ? body.questions : []) as QuizQuestion[];
      const answers = (Array.isArray(body?.answers) ? body.answers : []) as { id: string; answer: string }[];
      if (!questions.length || !answers.length) {
        return NextResponse.json({ error: "réponses manquantes" }, { status: 400 });
      }
      const graded = extractJson<{
        items: { id: string; marks_awarded: number; marks_total: number; comment: string }[];
        total_awarded: number; total: number; estimated_start: string; rationale: string;
      }>(
        await askClaude({
          system: placementGradeSystem(auth.firstName, auth.style, subj),
          content:
            questions.map((q) => {
              const a = answers.find((x) => x.id === q.id);
              return `QUESTION ${q.id} [${q.marks ?? 1} marks — ${q.tariff || ""}] : ${q.question}\nSA RÉPONSE : ${a?.answer?.trim() || "(pas de réponse)"}`;
            }).join("\n\n") + `\n\nCorrige et estime le point de départ.`,
          maxTokens: 4000,
          effort: "medium",
          workflow: "placement-grade",
          userId: auth.user.id,
          sb: auth.sb,
        })
      );
      const start = ["E", "D", "C", "B"].includes(graded.estimated_start) ? graded.estimated_start : "D";
      return NextResponse.json({ ...graded, estimated_start: start });
    }

    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "test impossible" }, { status: 502 });
  }
}
