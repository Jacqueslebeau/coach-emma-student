// Config PUBLIQUE du projet Supabase dédié « coach-emma-student ».
// L'URL et la publishable key sont publiques par conception (elles partent
// dans le bundle client) — la sécurité des données repose sur la RLS.
// Les variables d'env, si présentes, priment (utile pour pointer un autre projet).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://odlmsobbpiruplwqwtdl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_dcs5vU4JAD9cQGzC3vLjEw_ovhKYd-t";
