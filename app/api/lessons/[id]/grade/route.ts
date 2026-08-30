// Correction d'un quiz de maîtrise OU d'une re-vérification de remédiation :
// verdict par question + diagnostic par concept + méprise nommée.
// Met à jour concept_mastery et weak_points.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession, sessionElapsedMin } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { gradeSystem, gradeAuditSystem, formatAnswers , sessionClock } from "@/lib/prompts";
import { applyVerdicts } from "@/lib/mastery";
import type { Concept, QuizGrade, QuizQuestion } from "@/lib/types";

// Deux passes (correction + relecture d'examinateur) : on prend de la marge.
export const maxDuration = 300;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const attemptId = String(body?.attempt_id || "");
  const answers: { id: string; answer: string }[] = Array.isArray(body?.answers) ? body.answers : [];
  if (!attemptId || !answers.length) return NextResponse.json({ error: "réponses manquantes" }, { status: 400 });

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);

  const { data: attempt } = await auth.sb
    .from("attempts")
    .select("id, kind, payload, result")
    .eq("id", attemptId)
    .eq("lesson_id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!attempt || (attempt.kind !== "quiz" && attempt.kind !== "remediation")) {
    return NextResponse.json({ error: "tentative introuvable" }, { status: 404 });
  }
  if (attempt.result) {
    // Idempotent : déjà corrigé (double-clic, relance réseau).
    return NextResponse.json({ grade: attempt.result });
  }

  const questions = ((attempt.payload as { questions?: QuizQuestion[] })?.questions || []) as QuizQuestion[];
  const allConcepts = (lesson.concepts || []) as Concept[];
  // Pour une remédiation, on ne juge que le(s) concept(s) réellement testé(s).
  const testedKeys = new Set(questions.map((q) => q.concept_key));
  const concepts = allConcepts.filter((c) => testedKeys.has(c.key));

  // L'horloge d'Emma : minutes ecoulees dans la seance de tutorat en cours.
  const elapsed = await sessionElapsedMin({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id });

  try {
    const raw = await askClaude({
      system: gradeSystem(auth.firstName, auth.style, subj, concepts.length ? concepts : allConcepts) + sessionClock("tutoring", elapsed),
      content:
        `LEÇON : ${lesson.title}\n\n` +
        formatAnswers(questions, answers) +
        `\n\nCorrige, diagnostique par concept, nomme les méprises.`,
      maxTokens: 14000,
      workflow: attempt.kind === "quiz" ? "quiz-grade" : "remediation-grade",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    let grade = extractJson<QuizGrade>(raw);

    // Relecture d'examinateur : seconde passe qui répare les incohérences de
    // notation avant l'élève. Best-effort — si elle échoue, la correction
    // initiale part telle quelle.
    try {
      const audited = extractJson<QuizGrade>(
        await askClaude({
          system: gradeAuditSystem(auth.firstName, auth.style, subj),
          content:
            formatAnswers(questions, answers) +
            `\n\nCORRECTION PROPOSÉE (relis, répare, rends le JSON final) :\n${JSON.stringify(grade)}`,
          maxTokens: 16000,
          effort: "medium",
          workflow: attempt.kind === "quiz" ? "quiz-grade-audit" : "remediation-grade-audit",
          lessonId: id,
          userId: auth.user.id,
          sb: auth.sb,
        })
      );
      if (Array.isArray(audited?.items) && audited.items.length === grade.items?.length) grade = audited;
    } catch {
      // on garde la correction initiale
    }

    await auth.sb.from("attempts").update({ result: grade }).eq("id", attempt.id);
    await applyVerdicts({
      sb: auth.sb,
      userId: auth.user.id,
      lessonId: id,
      subject: lesson.subject,
      concepts: allConcepts,
      verdicts: (grade.concepts || []).map((v) => ({
        concept_key: v.concept_key,
        status: v.status,
        misconception: grade.items?.find((i) => i.misconception && questions.find((q) => q.id === i.id)?.concept_key === v.concept_key)?.misconception || null,
      })),
      source: attempt.kind,
    });

    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: attempt.kind === "quiz" ? "Diagnostic corrigé" : "Remédiation re-vérifiée" });
    return NextResponse.json({ grade });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "correction impossible" }, { status: 502 });
  }
}
