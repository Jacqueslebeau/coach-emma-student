-- Harnais qualité : une ligne par cellule d'évaluation
-- (matière × niveau d'élève simulé × topic), avec les notes du jury et le
-- dossier complet de la séance auditée.
create table if not exists public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  level text not null,
  topic text not null,
  scores jsonb not null,
  artifacts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists eval_runs_idx on public.eval_runs (subject, level, created_at desc);
alter table public.eval_runs enable row level security;
create policy "own eval runs" on public.eval_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
