// Capture d'une leçon : titre / notes / photo → identification des concepts
// (Edexcel 9MA0), création de la leçon. Les 3 portes d'entrée mènent au même endroit.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";
import { askClaude, extractJson, type ContentBlock } from "@/lib/claude";
import { conceptExtractionSystem } from "@/lib/prompts";
import { getSubjectBoard } from "@/lib/subjects";
import type { Concept } from "@/lib/types";

export const maxDuration = 120;

const IMG_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMG = 8 * 1024 * 1024;

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { data } = await auth.sb
    .from("lessons")
    .select("id, title, subject, exam_board, spec_topic, stage, concepts, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ lessons: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "formulaire invalide" }, { status: 400 });

  // Le board de la leçon vient de l'inscription de l'élève dans cette matière.
  const subjectKey = String(form.get("subject") || "maths");
  const { data: enr } = await auth.sb
    .from("subject_enrolments")
    .select("board")
    .eq("user_id", auth.user.id)
    .eq("subject", subjectKey)
    .maybeSingle();
  const subj = getSubjectBoard(subjectKey, enr?.board, auth.contentLang);
  const title = String(form.get("title") || "").trim().slice(0, 300);
  const notes = String(form.get("notes") || "").trim().slice(0, 12000);
  const photo = form.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;

  if (!title && !notes && !hasPhoto) {
    return NextResponse.json({ error: "Donne au moins le titre, tes notes, ou une photo du cours." }, { status: 400 });
  }

  // Construit l'entrée multimodale pour l'identification des concepts.
  const blocks: ContentBlock[] = [];
  let photoBytes: Buffer | null = null;
  let photoType = "";
  if (hasPhoto) {
    const f = photo as File;
    if (!IMG_TYPES.has(f.type)) return NextResponse.json({ error: "Format de photo non supporté (jpeg/png/webp)." }, { status: 400 });
    if (f.size > MAX_IMG) return NextResponse.json({ error: "Photo trop lourde (max 8 Mo)." }, { status: 400 });
    photoBytes = Buffer.from(await f.arrayBuffer());
    photoType = f.type;
    blocks.push({ type: "image", source: { type: "base64", media_type: photoType, data: photoBytes.toString("base64") } });
  }
  blocks.push({
    type: "text",
    text:
      `CE QUE L'ÉLÈVE DONNE SUR SA LEÇON DU JOUR :\n` +
      (title ? `TITRE DE LA LEÇON : ${title}\n` : "") +
      (notes ? `SES NOTES :\n${notes}\n` : "") +
      (hasPhoto ? `(+ la photo de son cours ci-jointe)\n` : "") +
      `\nIdentifie la leçon dans le programme et découpe-la en concepts.`,
  });

  let parsed: {
    lesson_title: string;
    spec_topic: string;
    needs_clarification?: boolean;
    clarification?: string | null;
    concepts: Concept[];
  };
  try {
    const raw = await askClaude({
      system: conceptExtractionSystem(auth.firstName, auth.style, subj),
      content: blocks,
      maxTokens: 2000,
      workflow: "concept-extraction",
      userId: auth.user.id,
      sb: auth.sb,
    });
    parsed = extractJson(raw);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "analyse impossible" }, { status: 502 });
  }

  if (parsed.needs_clarification) {
    return NextResponse.json({ needs_clarification: true, clarification: parsed.clarification || "Peux-tu préciser le chapitre ?" }, { status: 422 });
  }
  if (!Array.isArray(parsed.concepts) || parsed.concepts.length === 0) {
    return NextResponse.json({ error: "Concepts non identifiés — réessaie avec plus de détails." }, { status: 502 });
  }

  const { data: lesson, error } = await auth.sb
    .from("lessons")
    .insert({
      user_id: auth.user.id,
      subject: subj.key,
      exam_board: subj.board,
      title: parsed.lesson_title || title || "Leçon",
      notes: notes || null,
      spec_topic: parsed.spec_topic || null,
      concepts: parsed.concepts.slice(0, 6),
      stage: "captured",
    })
    .select("id")
    .single();
  if (error || !lesson) return NextResponse.json({ error: error?.message || "création impossible" }, { status: 500 });

  // Archive la photo du cours (best-effort — la boucle marche même si ça échoue).
  if (photoBytes) {
    const ext = photoType.split("/")[1] || "jpg";
    const path = `${auth.user.id}/${lesson.id}/lesson.${ext}`;
    const up = await auth.sb.storage.from("student-uploads").upload(path, photoBytes, { contentType: photoType, upsert: true });
    if (!up.error) await auth.sb.from("lessons").update({ photo_path: path }).eq("id", lesson.id);
  }

  await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: lesson.id, title: parsed.lesson_title || title || "Leçon", subject: subj.key, covered: "Leçon capturée" });
  return NextResponse.json({ id: lesson.id });
}
