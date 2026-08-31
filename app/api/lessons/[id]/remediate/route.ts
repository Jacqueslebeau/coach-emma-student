// Remédiation ciblée : on revoit PRÉCISÉMENT le concept raté (pas toute la
// leçon), sous un autre angle, puis 2 questions de re-vérification.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession, sessionElapsedMin } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { remediationSystem , sessionClock } from "@/lib/prompts";
import type { Concept, Remediation } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const conceptKey = String(body?.concept_key || "");
  if (!conceptKey) return NextResponse.json({ error: "concept manquant" }, { status: 400 });

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);
  const concept = ((lesson.concepts || []) as Concept[]).find((c) => c.key === conceptKey);
  if (!concept) return NextResponse.json({ error: "concept inconnu" }, { status: 404 });

  // La méprise identifiée au diagnostic guide l'angle de la ré-explication.
  const { data: wp } = await auth.sb
    .from("weak_points")
    .select("misconception")
    .eq("lesson_id", id)
    .eq("user_id", auth.user.id)
    .eq("concept_key", conceptKey)
    .eq("status", "open")
    .maybeSingle();

  // L'horloge d'Emma : minutes ecoulees dans la seance de tutorat en cours.
  const elapsed = await sessionElapsedMin({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id });

  try {
    const raw = await askClaude({
      system: remediationSystem(auth.firstName, auth.style, subj, concept, wp?.misconception || null) + sessionClock("tutoring", elapsed),
      content: `LEÇON : ${lesson.title}\n\nRé-explique « ${concept.label} » sous un autre angle puis pose les 2 questions.`,
      maxTokens: 4000,
      temperature: 0.3,
      effort: "medium",
      workflow: "remediation",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const remediation = extractJson<Remediation>(raw);

    const { data: attempt, error } = await auth.sb
      .from("attempts")
      .insert({ lesson_id: id, user_id: auth.user.id, kind: "remediation", payload: { concept_key: conceptKey, questions: remediation.questions } })
      .select("id")
      .single();
    if (error || !attempt) throw new Error(error?.message || "attempt");

    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: "Remédiation : " + concept.label });
    return NextResponse.json({ attempt_id: attempt.id, remediation });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "remédiation impossible" }, { status: 502 });
  }
}
