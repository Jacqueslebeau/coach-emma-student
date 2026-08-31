// DÉBRIEF COACHÉ D'UN PAST PAPER — le cœur du nouveau format : Emma a la
// copie corrigée sous les yeux (questions, réponses, marks, mark scheme) et
// coache l'élève dessus en conversation (2-4 phrases + une question par tour).
// Les échanges sont persistés (attempts kind "qa", stage "paper") : ils
// marquent le topic comme « Coached » dans la progression.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { askClaude } from "@/lib/claude";
import { paperCoachSystem } from "@/lib/prompts";
import { getSubjectBoard } from "@/lib/subjects";
import { paperContext } from "@/lib/paperContext";

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

async function loadPaper(sb: Awaited<ReturnType<typeof requireUser>>, paperId: string) {
  if (!sb) return null;
  const { data: attempt } = await sb.sb
    .from("attempts")
    .select("id, lesson_id, kind, payload, result")
    .eq("id", paperId)
    .eq("user_id", sb.user.id)
    .maybeSingle();
  if (!attempt || attempt.kind !== "exercise") return null;
  const lesson = await getOwnedLesson(sb.sb, attempt.lesson_id as string, sb.user.id);
  if (!lesson) return null;
  return { attempt, lesson };
}

export async function GET(_req: NextRequest, ctx: Params) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const { data } = await auth.sb
    .from("attempts")
    .select("id, payload, result, created_at")
    .eq("user_id", auth.user.id)
    .eq("kind", "qa")
    .contains("payload", { stage: "paper", paper_id: id })
    .order("created_at", { ascending: true })
    .limit(40);
  return NextResponse.json({
    messages: (data || []).map((a) => ({
      id: a.id,
      question: (a.payload as { question?: string })?.question || "",
      answer: (a.result as { answer?: string })?.answer || "",
    })),
  });
}

export async function POST(req: NextRequest, ctx: Params) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;

  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim().slice(0, 1500);
  if (!message) return NextResponse.json({ error: "empty message" }, { status: 400 });

  const loaded = await loadPaper(auth, id);
  if (!loaded) return NextResponse.json({ error: "paper not found" }, { status: 404 });
  const { attempt, lesson } = loaded;
  if (!attempt.result) return NextResponse.json({ error: "paper not marked yet" }, { status: 400 });
  const subj = getSubjectBoard(lesson.subject, lesson.exam_board, auth.contentLang);

  // L'historique du débrief (Emma s'en souvient dans la même séance).
  const { data: prev } = await auth.sb
    .from("attempts")
    .select("payload, result")
    .eq("user_id", auth.user.id)
    .eq("kind", "qa")
    .contains("payload", { stage: "paper", paper_id: id })
    .order("created_at", { ascending: true })
    .limit(12);
  const history = (prev || [])
    .map((a) => `STUDENT: ${(a.payload as { question?: string })?.question || ""}\nEMMA: ${(a.result as { answer?: string })?.answer || ""}`)
    .join("\n")
    .slice(0, 3000);

  try {
    const answer = await askClaude({
      system: paperCoachSystem(auth.firstName, auth.style, subj),
      content:
        `THE MARKED PAPER (lesson: ${lesson.title}):\n${paperContext(attempt)}\n\n` +
        (history ? `DEBRIEF SO FAR:\n${history}\n\n` : "") +
        `${auth.firstName || "The student"} says: « ${message} »`,
      maxTokens: 700,
      effort: "low",
      workflow: "paper-coach",
      lessonId: lesson.id,
      userId: auth.user.id,
      sb: auth.sb,
    });

    await auth.sb.from("attempts").insert({
      lesson_id: lesson.id,
      user_id: auth.user.id,
      kind: "qa",
      payload: { stage: "paper", paper_id: id, question: message },
      result: { answer },
    });
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "debrief unavailable" }, { status: 502 });
  }
}
