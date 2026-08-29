// Démarre l'OAuth Google Drive (scope drive.file — l'app ne voit que les
// fichiers qu'elle crée). state anti-CSRF en cookie httpOnly.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { authUrl, driveConfigured } from "@/lib/googleDrive";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "https://coach-emma-student.vercel.app"));
  if (!driveConfigured()) {
    return NextResponse.json({ error: "Google Drive integration is not configured yet" }, { status: 503 });
  }
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authUrl(state));
  res.cookies.set("g_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
