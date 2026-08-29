// Un past paper (série d'exercices) : énoncés + réponses + correction, avec
// les métadonnées de sa leçon. Alimente la page /paper/[id] — la bibliothèque
// centralisée des papers faits (visualisation + version imprimable).
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;

  const { data: attempt } = await auth.sb
    .from("attempts")
    .select("id, lesson_id, kind, payload, result, created_at")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("kind", "exercise")
    .maybeSingle();
  if (!attempt) return NextResponse.json({ error: "paper not found" }, { status: 404 });

  const { data: lesson } = await auth.sb
    .from("lessons")
    .select("id, title, subject, exam_board, spec_topic")
    .eq("id", attempt.lesson_id)
    .maybeSingle();

  return NextResponse.json({ attempt, lesson: lesson || null, first_name: auth.firstName });
}
