-- Consentement parental à l'inscription (l'élève est mineur : l'outil exige
-- l'email du parent/tuteur légal et son consentement) + journal des
-- connexions à la console (visible par l'élève et transmissible au parent).

alter table public.student_profiles
  add column if not exists parent_email text,
  add column if not exists parent_consent_at timestamptz;

-- Le trigger d'inscription copie l'email parent + l'horodatage du consentement
-- depuis les métadonnées du signup.
create or replace function public.handle_new_student()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.student_profiles (user_id, first_name, parent_email, parent_consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'parent_email', ''),
    case when new.raw_user_meta_data->>'parent_consent' = 'true' then now() else null end
  )
  on conflict (user_id) do nothing;
  return new;
end; $$;

create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  user_agent text default ''
);
alter table public.login_events enable row level security;
create policy "own logins" on public.login_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists login_events_user_at on public.login_events (user_id, at desc);
