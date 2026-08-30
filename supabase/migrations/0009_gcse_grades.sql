-- Note GCSE obtenue par matière (+ nuance lue sur le relevé uploadé, optionnel)
alter table subject_enrolments add column if not exists gcse_grade text;
alter table subject_enrolments add column if not exists gcse_note text;
