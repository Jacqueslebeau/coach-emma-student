import { supabaseServer } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorStyle } from "@/lib/types";

// Auth commune des route handlers : utilisateur connecté + profil (prénom,
// style d'Emma, niveaux) + client lié à la session (toutes les écritures
// passent par la RLS — pas de service_role dans cette app).
export async function requireUser() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb
    .from("student_profiles")
    .select("first_name, target_grade, tutor_style, current_grade, baseline_grade, content_lang, parent_email, parent_consent_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const style = (["strict", "sympa", "direct", "chatty"].includes(profile?.tutor_style)
    ? profile!.tutor_style
    : "sympa") as TutorStyle;
  return {
    user,
    sb: sb as SupabaseClient,
    firstName: (profile?.first_name as string) || "",
    style,
    currentGrade: (profile?.current_grade as string) || null,
    baselineGrade: (profile?.baseline_grade as string) || null,
    targetGrade: (profile?.target_grade as string) || "A*",
    // Langue d'enseignement : ANGLAIS par défaut (c'est un A Level).
    contentLang: (profile?.content_lang === "fr" ? "fr" : "en") as "en" | "fr",
    parentEmail: (profile?.parent_email as string) || null,
    parentConsentAt: (profile?.parent_consent_at as string) || null,
  };
}

export type AuthCtx = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

// Charge une leçon en vérifiant qu'elle appartient bien à l'utilisateur.
export async function getOwnedLesson(sb: SupabaseClient, lessonId: string, userId: string) {
  const { data } = await sb
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}
