// SCRIPT ORAL d'une section de cours : Emma transforme le texte écrit
// (markdown + LaTeX) en script naturel à lire à voix haute — formules dites en
// mots, ton de tutrice. Caché dans lessons.spoken (on ne paie qu'une fois).
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { askClaude } from "@/lib/claude";
import { getSubjectBoard } from "@/lib/subjects";
import type { Course } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "full" ? "full" : "key";
  const key = String(body?.section || ""); // "intro" | concept_key | "recap"

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const course = ((lesson.course || {}) as Record<string, Course>)[mode];
  if (!course) return NextResponse.json({ error: "cours absent" }, { status: 404 });

  const cacheKey = `${mode}:${key}`;
  const spoken = ((lesson as { spoken?: Record<string, string> }).spoken || {}) as Record<string, string>;
  if (spoken[cacheKey]) return NextResponse.json({ script: spoken[cacheKey], cached: true });

  const source =
    key === "intro" ? course.intro
    : key === "recap" ? course.recap
    : course.sections?.find((s) => s.concept_key === key)?.body;
  if (!source) return NextResponse.json({ error: "section introuvable" }, { status: 404 });

  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);
  const lang = subj.examLang === "fr" ? "French" : "English";
  try {
    const script = (
      await askClaude({
        system:
          `You are Emma, a warm UK sixth-form tutor. Turn the written course section below into a natural SPOKEN script, ready to be read aloud by a text-to-speech voice, in ${lang}.\n` +
          `RULES: keep EVERY piece of teaching content (nothing dropped, nothing added); say formulas and symbols in words (e.g. "x squared", "the derivative of y with respect to x", "pi over 3"); no markdown, no headings, no bullets — flowing sentences with natural transitions; keep exam terms as they are said aloud (command words, "mark scheme"); speak directly to the student ("you"). Output ONLY the script text.`,
        content: source.slice(0, 6000),
        maxTokens: 1500,
        effort: "low",
        workflow: "lesson-speak",
        lessonId: id,
        userId: auth.user.id,
        sb: auth.sb,
      })
    ).trim();

    await auth.sb.from("lessons").update({ spoken: { ...spoken, [cacheKey]: script } }).eq("id", id);
    return NextResponse.json({ script });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "script impossible" }, { status: 502 });
  }
}
