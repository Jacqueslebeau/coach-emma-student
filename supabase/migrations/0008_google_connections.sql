-- Intégration Google Drive (par élève) : le refresh token OAuth (scope
-- drive.file — l'app ne voit QUE les fichiers qu'elle crée) et le cache des
-- dossiers (racine « Coach Emma Student » + un dossier par matière).
create table if not exists public.google_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  access_token text,
  token_expires_at timestamptz,
  root_folder_id text,
  folder_ids jsonb not null default '{}',
  connected_at timestamptz not null default now()
);
alter table public.google_connections enable row level security;
create policy "own google connection" on public.google_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
