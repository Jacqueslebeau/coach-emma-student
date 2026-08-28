import type { SupabaseClient } from "@supabase/supabase-js";
import type { Concept, MasteryStatus } from "@/lib/types";

// Met à jour la maîtrise par concept + la liste des points à travailler.
// C'est la mémoire du produit : chaque verdict s'empile dans history (base de
// la révision espacée de la Phase 1). Écritures via le client de session (RLS).
export async function applyVerdicts(opts: {
  sb: SupabaseClient;
  userId: string;
  lessonId: string;
  concepts: Concept[];
  verdicts: { concept_key: string; status: MasteryStatus; misconception?: string | null }[];
  source: string; // quiz | remediation | exercise
}) {
  const { sb } = opts;
  const now = new Date().toISOString();
  for (const v of opts.verdicts) {
    const concept = opts.concepts.find((c) => c.key === v.concept_key);
    const label = concept?.label || v.concept_key;

    const { data: existing } = await sb
      .from("concept_mastery")
      .select("id, history")
      .eq("user_id", opts.userId)
      .eq("lesson_id", opts.lessonId)
      .eq("concept_key", v.concept_key)
      .maybeSingle();

    const history = [
      ...(Array.isArray(existing?.history) ? existing!.history : []),
      { at: now, status: v.status, source: opts.source },
    ].slice(-30);

    await sb.from("concept_mastery").upsert(
      {
        user_id: opts.userId,
        lesson_id: opts.lessonId,
        concept_key: v.concept_key,
        label,
        status: v.status,
        history,
        updated_at: now,
      },
      { onConflict: "user_id,lesson_id,concept_key" }
    );

    if (v.status === "acquis") {
      // Concept sécurisé → on résout les points ouverts dessus.
      await sb
        .from("weak_points")
        .update({ status: "resolved" })
        .eq("user_id", opts.userId)
        .eq("lesson_id", opts.lessonId)
        .eq("concept_key", v.concept_key)
        .eq("status", "open");
    } else {
      // Fragile / non acquis → un point ouvert (dédoublonné par concept).
      const { data: open } = await sb
        .from("weak_points")
        .select("id")
        .eq("user_id", opts.userId)
        .eq("lesson_id", opts.lessonId)
        .eq("concept_key", v.concept_key)
        .eq("status", "open")
        .maybeSingle();
      if (open) {
        if (v.misconception) {
          await sb.from("weak_points").update({ misconception: v.misconception }).eq("id", open.id);
        }
      } else {
        await sb.from("weak_points").insert({
          user_id: opts.userId,
          lesson_id: opts.lessonId,
          concept_key: v.concept_key,
          label,
          misconception: v.misconception || null,
          status: "open",
          // Révision espacée (amorce P1) : re-proposer à J+3.
          due_at: new Date(Date.now() + 3 * 864e5).toISOString(),
        });
      }
    }
  }
}

// Croise les items corrigés avec leurs concepts pour produire des verdicts.
export function verdictsFromExercises(
  items: { id: string; verdict: "secure" | "fragile" | "failed"; misconception: string | null }[],
  exercises: { id: string; concept_keys: string[] }[]
): { concept_key: string; status: MasteryStatus; misconception?: string | null }[] {
  const map = new Map<string, { status: MasteryStatus; misconception: string | null }>();
  const rank: Record<MasteryStatus, number> = { acquis: 0, fragile: 1, non_acquis: 2 };
  const toStatus: Record<string, MasteryStatus> = { secure: "acquis", fragile: "fragile", failed: "non_acquis" };
  for (const it of items) {
    const ex = exercises.find((e) => e.id === it.id);
    if (!ex) continue;
    const st = toStatus[it.verdict] || "fragile";
    for (const k of ex.concept_keys) {
      const prev = map.get(k);
      // Le pire verdict gagne : un concept raté sur un exercice reste à travailler.
      if (!prev || rank[st] > rank[prev.status]) {
        map.set(k, { status: st, misconception: it.misconception });
      }
    }
  }
  return [...map.entries()].map(([concept_key, v]) => ({ concept_key, ...v }));
}
