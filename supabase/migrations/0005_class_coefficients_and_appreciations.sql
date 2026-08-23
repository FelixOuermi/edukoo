-- Deux constats "Élevé" de l'audit notes/bulletins :
-- 1. Le coefficient d'une matière était unique pour toute l'école (Maths en
--    6ème = Maths en Terminale). class_subjects permet une surcharge par
--    classe ; en son absence, le coefficient global de subjects reste
--    utilisé (comportement inchangé pour les écoles qui n'en ont pas besoin).
-- 2. Le bulletin PDF affichait deux lignes vides "Appréciation du
--    directeur" à remplir à la main, et n'affichait jamais les absences.
--    bulletin_appreciations permet de saisir une vraie appréciation par
--    élève/trimestre ; les absences de l'année scolaire sont désormais
--    comptées et affichées sur le bulletin.

CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  coefficient INTEGER NOT NULL DEFAULT 1 CHECK (coefficient > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, subject_id)
);

ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation: class_subjects" ON class_subjects;
CREATE POLICY "School isolation: class_subjects"
  ON class_subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE TABLE IF NOT EXISTS bulletin_appreciations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  trimester INTEGER CHECK (trimester IN (1,2,3)),
  appreciation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, school_year_id, trimester)
);

ALTER TABLE bulletin_appreciations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation: bulletin_appreciations" ON bulletin_appreciations;
CREATE POLICY "School isolation: bulletin_appreciations"
  ON bulletin_appreciations FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
