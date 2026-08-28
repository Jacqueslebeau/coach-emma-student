import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/publicConfig";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client serveur lié aux cookies de session (utilisateur connecté dans les
// route handlers / server components). Respecte la RLS.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            items.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // appelé depuis un Server Component : ignoré (le middleware rafraîchit)
          }
        },
      },
    }
  );
}
