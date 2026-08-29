// État de l'intégration Google Drive de l'élève (panneau Integrations).
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { driveConfigured } from "@/lib/googleDrive";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { data } = await auth.sb
    .from("google_connections")
    .select("connected_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  return NextResponse.json({
    configured: driveConfigured(),
    connected: !!data,
    connected_at: data?.connected_at || null,
  });
}

export async function DELETE() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { data } = await auth.sb
    .from("google_connections")
    .select("refresh_token")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (data?.refresh_token) {
    // Révocation côté Google (best-effort).
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(data.refresh_token)}`, { method: "POST" }).catch(() => {});
  }
  await auth.sb.from("google_connections").delete().eq("user_id", auth.user.id);
  return NextResponse.json({ ok: true });
}
