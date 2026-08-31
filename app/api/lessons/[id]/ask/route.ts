// QUESTIONS DE L'ÉLÈVE — comme dans un vrai tutoring : après le cours, après
// le diagnostic, après la correction, l'élève peut lever la main (3 questions
// max par fenêtre). Emma répond ancrée sur la leçon et GARDE LE LEAD.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession, sessionElapsedMin } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { askSystem , sessionClock } from "@/lib/prompts";
import type { Concept } from "@/lib/types";

export const maxDuration = 60;

const MAX_QUESTIONS_PER_STAGE = 3;
const STAGES = new Set(["course", "quiz-result", "exercise-result"]);

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const { data } = await auth.sb
    .from("attempts")
    .select("id, payload, result, created_at")
    .eq("lesson_id", id)
    .eq("user_id", auth.user.id)
    .eq("kind", "qa")
    .order("created_at", { ascending: true })
    .limit(30);
  return NextResponse.json({
    questions: (data || []).map((a) => ({
      id: a.id,
      stage: (a.payload as { stage?: string })?.stage || "course",
      question: (a.payload as { question?: string })?.question || "",
      answer: (a.result as { answer?: string })?.answer || "",
      at: a.created_at,
    })),
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const question = String(body?.question || "").trim().slice(0, 1500);
  const stage = STAGES.has(String(body?.stage)) ? String(body.stage) : "course";
  if (!question) return NextResponse.json({ error: "empty question" }, { status: 400 });

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);
  const concepts = (lesson.concepts || []) as Concept[];

  // La fenêtre est bornée : 3 questions par étape — Emma garde le lead.
  const { count } = await auth.sb
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", id)
    .eq("user_id", auth.user.id)
    .eq("kind", "qa")
    .contains("payload", { stage });
  const used = count || 0;
  if (used >= MAX_QUESTIONS_PER_STAGE) {
    return NextResponse.json(
      { error: "Question window closed — Emma is keeping the session moving. You can revisit this in the next step or in coaching.", capped: true },
      { status: 429 }
    );
  }
  const questionsLeft = MAX_QUESTIONS_PER_STAGE - used;

  // Contexte : le cours de la leçon (le plus pertinent des deux modes).
  const courseObj = (lesson.course || {}) as Record<string, unknown>;
  const courseCtx = JSON.stringify(courseObj.full || courseObj.key || {}).slice(0, 5000);

  // L'horloge d'Emma : minutes ecoulees dans la seance de tutorat en cours.
  const elapsed = await sessionElapsedMin({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id });

  // Mode de réponse choisi par l'élève : "text" (écrit) ou "spoken" (Emma
  // répond à l'oral, soutenue par des slides visuelles — jamais les deux).
  const spoken = body?.mode === "spoken";

  try {
    const baseSystem = askSystem(auth.firstName, auth.style, subj, concepts, stage, questionsLeft) + sessionClock("tutoring", elapsed);
    const system = spoken
      ? baseSystem + `

FORMAT DE CETTE RÉPONSE — L'ÉLÈVE A CHOISI « POSE TA QUESTION » (réponse ORALE + visuel) :
Réponds UNIQUEMENT avec un JSON {"slides":[{"show":"…","say":"…"}]} de 2 à 4 slides.
- "show" : le VISUEL à l'écran — une formule en \\[ … \\] display, ou 2-3 bullets courts, ou un mot-clé en **gras**. JAMAIS un paragraphe.
- "say" : ce que ta voix dit sur cette slide (1-2 phrases naturelles, formules dites en mots). Total < 90 mots.
- La règle 6 (ramener vers la suite) vit dans le "say" de la DERNIÈRE slide.`
      : baseSystem;

    const rawAnswer = await askClaude({
      system,
      content:
        `LESSON: ${lesson.title}\nTOPIC: ${lesson.spec_topic || "—"}\n\n` +
        (courseCtx.length > 10 ? `THE COURSE EMMA WROTE FOR THIS LESSON (context):\n${courseCtx}\n\n` : "") +
        `${auth.firstName || "The student"} raises their hand and asks:\n« ${question} »`,
      maxTokens: spoken ? 700 : 900,
      effort: spoken ? "low" : undefined,
      workflow: "lesson-qa",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });

    let answer = rawAnswer;
    let slides: { show: string; say: string }[] | null = null;
    if (spoken) {
      try {
        const parsed = extractJson<{ slides: { show: string; say: string }[] }>(rawAnswer);
        slides = (parsed.slides || []).filter((s) => s?.show && s?.say).slice(0, 5);
        if (slides.length) answer = slides.map((s) => s.say).join(" ");
        else slides = null;
      } catch { slides = null; /* repli : réponse texte */ }
    }

    const { data: saved } = await auth.sb
      .from("attempts")
      .insert({ lesson_id: id, user_id: auth.user.id, kind: "qa", payload: { stage, question }, result: { answer } })
      .select("id")
      .single();

    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: "Questions to Emma" });
    return NextResponse.json({ id: saved?.id, answer, slides, questions_left: questionsLeft - 1 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "Emma could not answer — try again" }, { status: 502 });
  }
}
