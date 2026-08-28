import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/publicConfig";
import { createBrowserClient } from "@supabase/ssr";

// Client navigateur (auth côté client : login, session).
export function supabaseBrowser() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}
