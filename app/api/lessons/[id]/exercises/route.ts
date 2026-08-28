// Exercices style past paper Edexcel (9MA0). Priorise les concepts fragiles ;
// mode « variant » pour refaire sur le même point avec un énoncé différent.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";
import { getSubject } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { exercisesSystem } from "@/lib/prompts";
import type { Concept, Exercise } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const variant = !!body?.variant;
  const requestedKeys: string[] = Array.isArray(body?.concept_keys) ? body.concept_keys : [];

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubject(lesson.subject);
  const concepts = (lesson.concepts || []) as Concept[];

  // Concepts à prioriser : ceux demandés (redo), sinon les fragiles/non acquis.
  let focusKeys = requestedKeys.filter((k) => concepts.some((c) => c.key === k));
  if (!focusKeys.length) {
    const { data: mastery } = await auth.sb
      .from("concept_mastery")
      .select("concept_key, status")
      .eq("lesson_id", id)
      .eq("user_id", auth.user.id);
    focusKeys = (mastery || []).filter((m) => m.status !== "acquis").map((m) => m.concept_key);
  }

  try {
    const raw = await askClaude({
      system: exercisesSystem(auth.firstName, auth.style, subj, concepts, focusKeys, variant),
      content: `LEÇON : ${lesson.title}\nTOPIC : ${lesson.spec_topic || "—"}\n\nÉcris les 3 exercices.`,
      maxTokens: 3000,
      temperature: 0.4,
      workflow: "exercises",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const parsed = extractJson<{ exercises: Exercise[] }>(raw);
    if (!parsed.exercises?.length) throw new Error("exercices vides");

    const { data: attempt, error } = await auth.sb
      .from("attempts")
      .insert({ lesson_id: id, user_id: auth.user.id, kind: "exercise", payload: { exercises: parsed.exercises, variant } })
      .select("id")
      .single();
    if (error || !attempt) throw new Error(error?.message || "attempt");

    await auth.sb.from("lessons").update({ stage: "practice" }).eq("id", id);
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, covered: variant ? "Exercices (variante ciblée)" : "Exercices past paper" });
    return NextResponse.json({ attempt_id: attempt.id, exercises: parsed.exercises });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "génération impossible" }, { status: 502 });
  }
}
