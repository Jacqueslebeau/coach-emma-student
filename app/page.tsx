import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import Landing from "@/components/Landing";

// Page publique : le site vitrine (architecture Coach Emma — hero + halo,
// démo animée, DemoStudio, Commencer). Connecté → tableau de bord.
export default async function Home() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/dashboard");
  return <Landing />;
}
