import type { SupabaseClient } from "@supabase/supabase-js";

// Suivi automatique des séances (le tableau de bord s'appuie dessus).
// Une séance = kind (lesson|coaching) + ref (leçon ou null), démarrée à la
// première action et prolongée à chaque action. Si plus de 90 min d'écart,
// on considère que c'est une NOUVELLE séance.
const SESSION_GAP_MIN = 90;

export async function touchSession(opts: {
  sb: SupabaseClient;
  userId: string;
  kind: "lesson" | "coaching";
  refId?: string | null;
  title?: string;
  subject?: string;
  covered?: string; // élément couvert pendant l'action (ex. "Cours : chain rule")
}) {
  try {
    const { sb } = opts;
    const cutoff = new Date(Date.now() - SESSION_GAP_MIN * 60_000).toISOString();
    let q = sb
      .from("study_sessions")
      .select("id, summary")
      .eq("user_id", opts.userId)
      .eq("kind", opts.kind)
      .gte("last_activity_at", cutoff)
      .order("last_activity_at", { ascending: false })
      .limit(1);
    if (opts.refId) q = q.eq("ref_id", opts.refId);
    const { data: rows } = await q;
    const existing = rows?.[0];

    if (existing) {
      const covered: string[] = Array.isArray((existing.summary as { covered?: string[] })?.covered)
        ? (existing.summary as { covered: string[] }).covered
        : [];
      if (opts.covered && !covered.includes(opts.covered)) covered.push(opts.covered);
      await sb
        .from("study_sessions")
        .update({ last_activity_at: new Date().toISOString(), summary: { ...(existing.summary as object), covered } })
        .eq("id", existing.id);
      return existing.id as string;
    }

    const { data: created } = await sb
      .from("study_sessions")
      .insert({
        user_id: opts.userId,
        kind: opts.kind,
        ref_id: opts.refId || null,
        title: opts.title || (opts.kind === "coaching" ? "Coaching d'examen" : "Session de travail"),
        subject: opts.subject || "maths",
        summary: { covered: opts.covered ? [opts.covered] : [] },
      })
      .select("id")
      .single();
    return (created?.id as string) || null;
  } catch {
    return null; // le tracking ne casse jamais la boucle d'apprentissage
  }
}
