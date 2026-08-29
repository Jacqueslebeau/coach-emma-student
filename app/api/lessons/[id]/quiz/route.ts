// Questions de vérification de maîtrise (diagnostic concept par concept).
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { quizSystem } from "@/lib/prompts";
import type { Concept, QuizQuestion } from "@/lib/types";

export const maxDuration = 120;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board);
  const concepts = (lesson.concepts || []) as Concept[];

  try {
    const raw = await askClaude({
      system: quizSystem(auth.firstName, auth.style, subj, concepts),
      content: `LEÇON : ${lesson.title}\nTOPIC : ${lesson.spec_topic || "—"}\n\nÉcris les 5 questions de vérification.`,
      maxTokens: 2500,
      // un peu de variété pour ne pas retomber sur les mêmes questions au 2e passage
      temperature: 0.4,
      workflow: "mastery-quiz",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const parsed = extractJson<{ questions: QuizQuestion[] }>(raw);
    if (!parsed.questions?.length) throw new Error("questions vides");

    const { data: attempt, error } = await auth.sb
      .from("attempts")
      .insert({ lesson_id: id, user_id: auth.user.id, kind: "quiz", payload: { questions: parsed.questions } })
      .select("id")
      .single();
    if (error || !attempt) throw new Error(error?.message || "attempt");

    await auth.sb.from("lessons").update({ stage: "quiz" }).eq("id", id);
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: "Vérification de maîtrise" });
    return NextResponse.json({ attempt_id: attempt.id, questions: parsed.questions });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "génération impossible" }, { status: 502 });
  }
}
