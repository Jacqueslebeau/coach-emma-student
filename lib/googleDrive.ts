// Google Drive par élève — OAuth scope drive.file (l'app ne voit QUE les
// fichiers qu'elle crée). Les papers corrigés deviennent des Google Docs
// rangés dans « Coach Emma Student / <Subject> / », retrouvables à vie.
import type { SupabaseClient } from "@supabase/supabase-js";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://coach-emma-student.vercel.app";
export const REDIRECT_URI = `${SITE_URL}/api/google/callback`;
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export function driveConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";

async function tokenRequest(params: Record<string, string>) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      ...params,
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error_description || d.error || `google token HTTP ${r.status}`);
  return d as { access_token: string; refresh_token?: string; expires_in: number };
}

export function authUrl(state: string): string {
  const qs = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
}

export async function exchangeCode(code: string) {
  return tokenRequest({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI });
}

// Access token valide pour l'utilisateur (rafraîchi et persisté si besoin).
export async function getAccessToken(sb: SupabaseClient, userId: string): Promise<string | null> {
  const { data: conn } = await sb
    .from("google_connections")
    .select("refresh_token, access_token, token_expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn) return null;
  const stillValid =
    conn.access_token && conn.token_expires_at && new Date(conn.token_expires_at).getTime() - Date.now() > 120_000;
  if (stillValid) return conn.access_token as string;
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: conn.refresh_token as string });
  await sb
    .from("google_connections")
    .update({
      access_token: t.access_token,
      token_expires_at: new Date(Date.now() + (t.expires_in || 3600) * 1000).toISOString(),
    })
    .eq("user_id", userId);
  return t.access_token;
}

async function drive(token: string, path: string, init?: RequestInit) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...(init?.headers || {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: { message?: string } }).error?.message || `drive HTTP ${r.status}`);
  return d;
}

// Trouve ou crée un dossier (par nom, sous un parent).
export async function ensureFolder(token: string, name: string, parentId?: string): Promise<string> {
  const q = [
    `name = '${name.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    "trashed = false",
    parentId ? `'${parentId}' in parents` : "",
  ].filter(Boolean).join(" and ");
  const found = (await drive(token, `files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1`)) as { files?: { id: string }[] };
  if (found.files?.length) return found.files[0].id;
  const created = (await drive(token, "files?fields=id", {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  })) as { id: string };
  return created.id;
}

// Upload d'un HTML converti en GOOGLE DOC dans un dossier.
export async function uploadHtmlAsDoc(
  token: string,
  opts: { name: string; parentId: string; html: string }
): Promise<{ id: string; link: string }> {
  const boundary = "cesb-" + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({
    name: opts.name,
    parents: [opts.parentId],
    mimeType: "application/vnd.google-apps.document",
  });
  const body =
    `--${boundary}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\ncontent-type: text/html; charset=UTF-8\r\n\r\n${opts.html}\r\n--${boundary}--`;
  const r = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as { error?: { message?: string } }).error?.message || `drive upload HTTP ${r.status}`);
  return { id: (d as { id: string }).id, link: (d as { webViewLink?: string }).webViewLink || `https://drive.google.com/file/d/${(d as { id: string }).id}` };
}
