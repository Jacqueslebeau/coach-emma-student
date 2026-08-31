// PERSISTANCE DES ÉCHANGES VOCAUX (coaching ou leçon) : le transcript de la
// conversation temps réel est flushé ici à la fin — il alimente l'historique,
// les comptes rendus et la mémoire d'Emma, comme les échanges écrits.
import { NextRequest, NextResponse } from "next/server";
import { requireUser, getOwnedLesson } from "@/lib/routeAuth";
import { touchSession } from "@/lib/sessionTrack";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "lesson" ? "lesson" : body?.mode === "paper" ? "paper" : "coaching";
  const lines = (Array.isArray(body?.lines) ? body.lines : [])
    .filter((l: { role?: string; message?: string }) => l?.message && (l.role === "user" || l.role === "assistant"))
    .slice(0, 60)
    .map((l: { role: string; message: string }) => ({ role: l.role, message: String(l.message).slice(0, 2000) }));
  if (!lines.length) return NextResponse.json({ ok: true, saved: 0 });

  try {
    if (mode === "coaching") {
      const sessionId = await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "coaching", subject: "general", covered: "Coaching vocal" });
      await auth.sb.from("coaching_messages").insert(
        lines.map((l: { role: string; message: string }) => ({
          user_id: auth.user.id, session_id: sessionId, role: l.role, message: l.message,
        }))
      );
      return NextResponse.json({ ok: true, saved: lines.length });
    }

    // Leçon / débrief de paper : les paires question→réponse rejoignent le
    // fil Q&A de la leçon (un débrief vocal marque le paper comme « Coached »).
    const paperId = mode === "paper" ? String(body?.paper_id || "") : null;
    let lessonId = String(body?.lesson_id || "");
    if (paperId) {
      const { data: attempt } = await auth.sb
        .from("attempts")
        .select("lesson_id")
        .eq("id", paperId)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (attempt?.lesson_id) lessonId = attempt.lesson_id as string;
    }
    const lesson = await getOwnedLesson(auth.sb, lessonId, auth.user.id);
    if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });
    const rows: { lesson_id: string; user_id: string; kind: string; payload: object; result: object }[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].role !== "user") continue;
      const answer = lines[i + 1]?.role === "assistant" ? lines[i + 1].message : "";
      rows.push({
        lesson_id: lessonId, user_id: auth.user.id, kind: "qa",
        payload: paperId ? { stage: "paper", paper_id: paperId, question: lines[i].message } : { stage: "voice", question: lines[i].message },
        result: { answer },
      });
    }
    if (rows.length) await auth.sb.from("attempts").insert(rows);
    await touchSession({ sb: auth.sb, userId: auth.user.id, kind: "lesson", refId: lessonId, title: lesson.title, subject: lesson.subject, covered: "Voice chat with Emma" });
    return NextResponse.json({ ok: true, saved: rows.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || "log failed" }, { status: 502 });
  }
}
