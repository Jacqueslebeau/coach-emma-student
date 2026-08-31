// LA VOIX TEMPS RÉEL D'EMMA — même mécanisme que Coach Emma : agent
// conversationnel ElevenLabs (il ENTEND l'élève et répond de vive voix).
// Deux modes : "coaching" (coach d'examen) et "lesson" (tutrice ancrée sur
// la leçon en cours). Renvoie une signed URL + les variables dynamiques
// injectées côté client dans startSession().
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { SUBJECTS, type SubjectKey } from "@/lib/subjects";
import { estimateGrade } from "@/lib/examTechnique";
import { paperContext } from "@/lib/paperContext";
import type { Concept, Course } from "@/lib/types";

// Agents créés le 2026-08-31 (voix Emma approuvée 6MCJQJe3NCkhDRHZaJ31).
const COACH_AGENT = process.env.ELEVENLABS_COACH_AGENT_ID || "agent_2401m1c6ep29e4n820y7v91ej0xs";
const TUTOR_AGENT = process.env.ELEVENLABS_TUTOR_AGENT_ID || "agent_1101m1c6h2tzemwrwhgmxv3s27kq";

async function signedUrl(apiKey: string, agentId: string): Promise<string | null> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": apiKey } }
  );
  if (!resp.ok) return null;
  const data = await resp.json().catch(() => ({}));
  return data?.signed_url || data?.signedUrl || null;
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "voice not configured" }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "lesson" ? "lesson" : body?.mode === "paper" ? "paper" : "coaching";

  try {
    if (mode === "paper") {
      // DÉBRIEF VOCAL de la copie corrigée — l'agent tutrice, ancré sur le paper.
      const paperId = String(body?.paper_id || "");
      const { data: attempt } = await auth.sb
        .from("attempts")
        .select("id, lesson_id, kind, payload, result")
        .eq("id", paperId)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!attempt || attempt.kind !== "exercise" || !attempt.result) {
        return NextResponse.json({ error: "marked paper not found" }, { status: 404 });
      }
      const lesson = await getOwnedLesson(auth.sb, attempt.lesson_id as string, auth.user.id);
      if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });

      const url = await signedUrl(apiKey, TUTOR_AGENT);
      if (!url) return NextResponse.json({ error: "voice unavailable" }, { status: 502 });
      return NextResponse.json({
        signed_url: url,
        vars: {
          student_first_name: auth.firstName || "there",
          lesson_title: `Past paper debrief — ${lesson.title}`,
          subject_board: `${SUBJECTS[lesson.subject as SubjectKey]?.labelEn || lesson.subject} · ${lesson.exam_board || "A Level"}`,
          concepts: ((lesson.concepts || []) as Concept[]).map((c) => c.label).join(", ") || "—",
          course_context:
            `THIS IS A MARKED PAST PAPER DEBRIEF. Coach the student ON THIS MARKED PAPER: open on what they did well, then work the most costly mark losses ONE at a time, make them redo the step out loud, and close with the 1-2 reflexes to remember (have them say the reflexes back).\n\n` +
            paperContext(attempt),
        },
      });
    }
    if (mode === "lesson") {
      // TUTRICE VOCALE ancrée sur LA leçon en cours.
      const lessonId = String(body?.lesson_id || "");
      const lesson = await getOwnedLesson(auth.sb, lessonId, auth.user.id);
      if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });
      const concepts = ((lesson.concepts || []) as Concept[]).map((c) => c.label).join(", ");
      const courseObj = (lesson.course || {}) as Record<string, Course>;
      const course = courseObj.full || courseObj.key;
      const courseCtx = course
        ? [course.intro, ...(course.sections || []).map((s) => `${s.title}: ${s.body}`), course.recap]
            .filter(Boolean).join("\n").slice(0, 9000)
        : "course not written yet — anchor on the lesson title and concepts";

      const url = await signedUrl(apiKey, TUTOR_AGENT);
      if (!url) return NextResponse.json({ error: "voice unavailable" }, { status: 502 });
      return NextResponse.json({
        signed_url: url,
        vars: {
          student_first_name: auth.firstName || "there",
          lesson_title: lesson.title,
          subject_board: `${SUBJECTS[lesson.subject as SubjectKey]?.labelEn || lesson.subject} · ${lesson.exam_board || "A Level"}`,
          concepts: concepts || "—",
          course_context: courseCtx,
        },
      });
    }

    // COACH D'EXAMEN — le contexte RÉEL de l'élève (le coach cite du vrai).
    const [{ data: enrolments }, { data: attempts }, { data: weakPoints }, { data: history }] = await Promise.all([
      auth.sb.from("subject_enrolments").select("subject, board, target_grade").eq("user_id", auth.user.id),
      auth.sb
        .from("attempts")
        .select("result, created_at")
        .eq("user_id", auth.user.id)
        .eq("kind", "exercise")
        .not("result", "is", null)
        .order("created_at", { ascending: false })
        .limit(6),
      auth.sb.from("weak_points").select("label").eq("user_id", auth.user.id).eq("status", "open").limit(8),
      auth.sb.from("coaching_messages").select("role, message").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(12),
    ]);

    const pcts = (attempts || [])
      .map((a) => {
        const items = (a.result as { items?: { marks_awarded?: number; marks_total?: number }[] })?.items || [];
        const tot = items.reduce((s, i) => s + (i.marks_total || 0), 0);
        const got = items.reduce((s, i) => s + (i.marks_awarded || 0), 0);
        return tot > 0 ? Math.round((100 * got) / tot) : null;
      })
      .filter((p): p is number => p !== null);

    const url = await signedUrl(apiKey, COACH_AGENT);
    if (!url) return NextResponse.json({ error: "voice unavailable" }, { status: 502 });
    return NextResponse.json({
      signed_url: url,
      vars: {
        student_first_name: auth.firstName || "there",
        subjects_line: (enrolments || []).length
          ? (enrolments || []).map((e) => `${SUBJECTS[e.subject as SubjectKey]?.labelEn || e.subject} (${e.board})`).join(", ")
          : "not set up yet",
        current_grade: auth.currentGrade || "not recorded",
        target_grade: auth.targetGrade || "A*",
        progress_summary: pcts.length
          ? `latest exercise sets (most recent first): ${pcts.map((p) => p + "%").join(", ")} — current indicative grade ${estimateGrade(pcts[0])}`
          : "no marked exercises yet",
        weak_points: (weakPoints || []).map((w) => w.label).join(" · ") || "none recorded yet",
        coach_history:
          (history || []).reverse().map((h) => (h.role === "user" ? "STUDENT: " : "EMMA: ") + h.message).join("\n").slice(0, 2500) ||
          "first session",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "voice unavailable" }, { status: 502 });
  }
}
