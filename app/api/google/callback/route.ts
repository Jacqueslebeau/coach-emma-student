// Retour de l'OAuth Google : vérifie le state, échange le code, stocke le
// refresh token — l'élève est connecté à son Drive.
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/routeAuth";
import { exchangeCode, SITE_URL } from "@/lib/googleDrive";

export async function GET(req: NextRequest) {
  const back = (q: string) => NextResponse.redirect(`${SITE_URL}/dashboard?drive=${q}`);
  const auth = await requireUser();
  if (!auth) return NextResponse.redirect(`${SITE_URL}/login`);

  const url = new URL(req.url);
  // Google renvoie ?error=access_denied quand le compte n'est pas dans les
  // Test users de l'app OAuth (ou refus manuel) — on le remonte tel quel.
  const gError = url.searchParams.get("error");
  if (gError) return back(gError === "access_denied" ? "denied" : "error");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("g_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return back("error");

  try {
    const t = await exchangeCode(code);
    if (!t.refresh_token) return back("error"); // prompt=consent le garantit normalement
    await auth.sb.from("google_connections").upsert({
      user_id: auth.user.id,
      refresh_token: t.refresh_token,
      access_token: t.access_token,
      token_expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
      connected_at: new Date().toISOString(),
    });
    const res = back("connected");
    res.cookies.set("g_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return back("error");
  }
}
