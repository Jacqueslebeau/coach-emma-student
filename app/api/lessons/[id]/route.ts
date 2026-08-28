// Détail d'une leçon : la leçon + maîtrise par concept + dernières tentatives
// + points à travailler. Tout ce qu'il faut pour reprendre la boucle où elle en est.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { id } = await ctx.params;

  const lesson = await getOwnedLesson(auth.sb, id, auth.user.id);
  if (!lesson) return NextResponse.json({ error: "leçon introuvable" }, { status: 404 });

  const [{ data: mastery }, { data: attempts }, { data: weakPoints }] = await Promise.all([
    auth.sb.from("concept_mastery").select("concept_key, label, status, updated_at").eq("lesson_id", id).eq("user_id", auth.user.id),
    auth.sb.from("attempts").select("id, kind, payload, result, created_at").eq("lesson_id", id).eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(10),
    auth.sb.from("weak_points").select("id, concept_key, label, misconception, status, created_at").eq("lesson_id", id).eq("user_id", auth.user.id).order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    lesson,
    mastery: mastery || [],
    attempts: attempts || [],
    weak_points: weakPoints || [],
    first_name: auth.firstName,
  });
}
