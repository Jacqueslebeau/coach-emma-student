-- Sessions d'étude (suivi de durée + contenu couvert), coaching d'examen,
-- style du tuteur et niveaux (départ / actuel / visé).

-- Profil : style d'Emma + niveaux
alter table public.student_profiles
  add column if not exists tutor_style text not null default 'sympa',       -- strict | sympa | direct | chatty
  add column if not exists current_grade text,                              -- niveau auto-déclaré / mis à jour
  add column if not exists baseline_grade text;                             -- niveau de DÉPART (figé à la 1re saisie)

-- Sessions d'étude : une ligne par séance (leçon ou coaching).
-- started_at → last_activity_at = durée réelle, mise à jour à chaque action.
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null default 'maths',
  kind text not null,                              -- lesson | coaching
  ref_id uuid,                                     -- lessons.id si kind=lesson
  title text not null default '',
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  summary jsonb not null default '{}'::jsonb       -- {covered:[], outcomes:[]}
);
create index if not exists study_sessions_user_idx on public.study_sessions (user_id, started_at desc);
alter table public.study_sessions enable row level security;
create policy "own sessions" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Coaching d'examen (texte) : historique des échanges.
create table if not exists public.coaching_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  role text not null,                              -- user | assistant
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists coaching_messages_user_idx on public.coaching_messages (user_id, created_at desc);
alter table public.coaching_messages enable row level security;
create policy "own coaching" on public.coaching_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
