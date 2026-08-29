// Génère le cours de la leçon — complet ou « concepts clés ». Idempotent par
// mode (re-servi depuis la base si déjà généré).
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson } from "@/lib/claude";
import { courseSystem } from "@/lib/prompts";
import type { Concept, Course } from "@/lib/types";

export const maxDuration = 180;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const mode: "full" | "key" = body?.mode === "key" ? "key" : "full";

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);

  const existing = (lesson.course || {}) as Record<string, Course>;
  if (existing[mode]?.sections?.length) {
    return NextResponse.json({ course: existing[mode] });
  }

  const concepts = (lesson.concepts || []) as Concept[];
  const userMsg =
    `LEÇON : ${lesson.title}\nTOPIC : ${lesson.spec_topic || "—"}\n` +
    (lesson.notes ? `\nSES NOTES DE CLASSE (appuie-toi dessus, garde ses notations si elles sont bonnes) :\n${String(lesson.notes).slice(0, 8000)}` : "") +
    `\n\nÉcris le cours (${mode === "full" ? "complet" : "concepts clés"}).`;

  try {
    const raw = await askClaude({
      system: courseSystem(auth.firstName, auth.style, subj, mode, concepts),
      content: userMsg,
      maxTokens: mode === "full" ? 8000 : 3500,
      workflow: `course-${mode}`,
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const course = extractJson<Course>(raw);
    await auth.sb
      .from("lessons")
      .update({ course: { ...existing, [mode]: course }, stage: lesson.stage === "captured" ? "course" : lesson.stage })
      .eq("id", id);
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: mode === "full" ? "Cours complet" : "Concepts clés" });
    return NextResponse.json({ course });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "génération impossible" }, { status: 502 });
  }
}
