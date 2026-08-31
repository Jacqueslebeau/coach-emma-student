// SCRIPT ORAL d'une section de cours : Emma transforme le texte écrit
// (markdown + LaTeX) en script naturel à lire à voix haute — formules dites en
// mots, ton de tutrice. Caché dans lessons.spoken (on ne paie qu'une fois).
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { askClaude, extractJson } from "@/lib/claude";
import { getSubjectBoard } from "@/lib/subjects";
import type { Course } from "@/lib/types";

export const maxDuration = 60;

export type Slide = { show: string; say: string };

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "full" ? "full" : "key";
  const key = String(body?.section || ""); // "intro" | concept_key | "recap"
  const wantSlides = body?.format === "slides";

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const course = ((lesson.course || {}) as Record<string, Course>)[mode];
  if (!course) return NextResponse.json({ error: "cours absent" }, { status: 404 });

  const cacheKey = wantSlides ? `sl:${mode}:${key}` : `${mode}:${key}`;
  const spoken = ((lesson as { spoken?: Record<string, string> }).spoken || {}) as Record<string, string>;
  if (spoken[cacheKey]) {
    return NextResponse.json(
      wantSlides ? { slides: JSON.parse(spoken[cacheKey]), cached: true } : { script: spoken[cacheKey], cached: true }
    );
  }

  const source =
    key === "intro" ? course.intro
    : key === "recap" ? course.recap
    : course.sections?.find((s) => s.concept_key === key)?.body;
  if (!source) return NextResponse.json({ error: "section introuvable" }, { status: 404 });

  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);
  const lang = subj.examLang === "fr" ? "French" : "English";
  try {
    if (wantSlides) {
      // STORYBOARD façon mini-vidéo : des écrans visuels (vraies formules
      // LaTeX, bullets) + une narration courte et punchy. Court = démarrage
      // rapide ET attention d'un public de 16-18 ans.
      const raw = await askClaude({
        system:
          `You are Emma, an energetic UK sixth-form tutor making a SHORT explainer video (60-90 seconds) about ONE concept, for a 16-18 year old, in ${lang}.\n` +
          `Turn the course section below into a storyboard of 4 to 7 slides. Respond ONLY with JSON:\n` +
          `{"slides":[{"show":"…","say":"…"}]}\n` +
          `RULES for "show" (what appears ON SCREEN — visual, punchy):\n` +
          `- 1 short heading line and/or up to 3 bullets ("- …"). NEVER a paragraph.\n` +
          `- REAL maths formulas in LaTeX: \\\\( inline \\\\) or \\\\[ display \\\\] — the formula itself, never spelled out in words. The key formula of the concept MUST appear as a display formula on its own slide.\n` +
          `- **bold** the crucial words. One tasteful emoji allowed per slide (🎯 ⚠️ 💡 ✅).\n` +
          `- The LAST slide is the takeaway: the one thing to remember + the classic exam trap ⚠️.\n` +
          `RULES for "say" (what Emma's voice says over the slide):\n` +
          `- 1-2 spoken sentences, natural and warm, formulas said in words ("x squared", "u times v"). Total narration across all slides UNDER 130 words.\n` +
          `- Teach the idea — don't read the slide out loud.\n` +
          `Keep the content faithful to the section (nothing invented).`,
        content: source.slice(0, 5000),
        maxTokens: 1200,
        effort: "low",
        workflow: "lesson-explainer",
        lessonId: id,
        userId: auth.user.id,
        sb: auth.sb,
      });
      const parsed = extractJson<{ slides: Slide[] }>(raw);
      const slides = (parsed.slides || []).filter((s) => s?.show && s?.say).slice(0, 8);
      if (!slides.length) throw new Error("empty storyboard");
      await auth.sb.from("lessons").update({ spoken: { ...spoken, [cacheKey]: JSON.stringify(slides) } }).eq("id", id);
      return NextResponse.json({ slides });
    }

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
