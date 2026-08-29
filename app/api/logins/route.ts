// Journal des connexions à la console : POST à chaque connexion réussie
// (appelé par la page de login), GET pour l'afficher au tableau de bord et
// l'inclure dans la lettre de connexion envoyée au parent.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const ua = (req.headers.get("user-agent") || "").slice(0, 300);
  await auth.sb.from("login_events").insert({ user_id: auth.user.id, user_agent: ua });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "non authentifié" }, { status: 401 });
  const { data } = await auth.sb
    .from("login_events")
    .select("id, at, user_agent")
    .eq("user_id", auth.user.id)
    .order("at", { ascending: false })
    .limit(30);
  return NextResponse.json({ logins: data || [] });
}
