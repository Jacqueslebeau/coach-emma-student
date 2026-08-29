// Correction des exercices en examinateur Edexcel (mark scheme, method marks).
// Accepte les réponses tapées ET/OU jusqu'à 3 photos de la copie manuscrite.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";
import { getSubjectBoard } from "@/lib/subjects";
import { askClaude, extractJson, type ContentBlock } from "@/lib/claude";
import { markSystem } from "@/lib/prompts";
import { applyVerdicts, verdictsFromExercises } from "@/lib/mastery";
import type { Concept, Exercise, ExerciseMark } from "@/lib/types";

export const maxDuration = 240;

const IMG_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMG = 8 * 1024 * 1024;
const MAX_PHOTOS = 3;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "formulaire invalide" }, { status: 400 });

  const attemptId = String(form.get("attempt_id") || "");
  let answers: { id: string; answer: string }[] = [];
  try {
    answers = JSON.parse(String(form.get("answers") || "[]"));
  } catch { /* réponses tapées absentes → photos seules */ }
  const photos = form.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0).slice(0, MAX_PHOTOS);

  const typedSomething = answers.some((a) => a.answer?.trim());
  if (!attemptId || (!typedSomething && !photos.length)) {
    return NextResponse.json({ error: "Tape tes réponses ou uploade la photo de ta copie." }, { status: 400 });
  }

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
  if (!attempt || attempt.kind !== "exercise") return NextResponse.json({ error: "tentative introuvable" }, { status: 404 });
  if (attempt.result) return NextResponse.json({ mark: attempt.result });

  const exercises = ((attempt.payload as { exercises?: Exercise[] })?.exercises || []) as Exercise[];
  const concepts = (lesson.concepts || []) as Concept[];

  // Entrée multimodale : copie photographiée + réponses tapées.
  const blocks: ContentBlock[] = [];
  const stored: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const f = photos[i];
    if (!IMG_TYPES.has(f.type)) return NextResponse.json({ error: "Format de photo non supporté (jpeg/png/webp)." }, { status: 400 });
    if (f.size > MAX_IMG) return NextResponse.json({ error: "Photo trop lourde (max 8 Mo)." }, { status: 400 });
    const bytes = Buffer.from(await f.arrayBuffer());
    blocks.push({ type: "image", source: { type: "base64", media_type: f.type, data: bytes.toString("base64") } });
    // Archive la copie (best-effort).
    const ext = f.type.split("/")[1] || "jpg";
    const path = `${auth.user.id}/${id}/work-${attempt.id}-${i}.${ext}`;
    const up = await auth.sb.storage.from("student-uploads").upload(path, bytes, { contentType: f.type, upsert: true });
    if (!up.error) stored.push(path);
  }
  blocks.push({
    type: "text",
    text:
      `SON TRAVAIL SUR LES EXERCICES :\n` +
      (photos.length ? `— ${photos.length} photo(s) de sa copie manuscrite ci-jointes.\n` : "") +
      (typedSomething
        ? `— Réponses tapées :\n` + exercises.map((e) => {
            const a = answers.find((x) => x.id === e.id);
            return `${e.id}: ${a?.answer?.trim() || "(rien tapé — voir la copie photo)"}`;
          }).join("\n")
        : "") +
      `\n\nCorrige au mark scheme et rends ta décision.`,
  });

  try {
    const raw = await askClaude({
      system: markSystem(auth.firstName, auth.style, subj, concepts, exercises),
      content: blocks,
      maxTokens: 6000,
      workflow: "exercise-mark",
      lessonId: id,
      userId: auth.user.id,
      sb: auth.sb,
    });
    const mark = extractJson<ExerciseMark>(raw);

    await auth.sb.from("attempts").update({ result: { ...mark, photos: stored } }).eq("id", attempt.id);
    await applyVerdicts({
      sb: auth.sb,
      userId: auth.user.id,
      lessonId: id,
      subject: lesson.subject,
      concepts,
      verdicts: verdictsFromExercises(mark.items || [], exercises),
      source: "exercise",
    });

    if (mark.decision === "advance") {
      await auth.sb.from("lessons").update({ stage: "done" }).eq("id", id);
    }
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: id, title: lesson.title, subject: lesson.subject, covered: "Correction au mark scheme" });
    return NextResponse.json({ mark });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "correction impossible" }, { status: 502 });
  }
}
