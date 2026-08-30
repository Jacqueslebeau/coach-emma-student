-- Scripts oraux du cours (cache par mode+concept) — la version que la voix lit
alter table lessons add column if not exists spoken jsonb;
