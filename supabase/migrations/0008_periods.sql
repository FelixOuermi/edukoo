-- Dernier constat "Moyen" de l'audit encore ouvert : les trimestres
-- étaient un simple entier (1/2/3) sans dates associées. periods permet à
-- chaque école de définir ses propres périodes (trimestres, semestres...)
-- avec de vraies dates de début/fin par année scolaire.
--
-- Bénéfice concret immédiat : le comptage d'absences sur le bulletin
-- (jusqu'ici sur l'année scolaire entière, faute de dates de période) peut
-- désormais se limiter à la période réelle quand elle est configurée.
--
-- La contrainte sur grades.trimester est assouplie de IN (1,2,3) à
-- 1..6 pour permettre des semestres (2) ou des découpages plus fins,
-- sans casser les données existantes (toutes en 1/2/3).

CREATE TABLE IF NOT EXISTS periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 6),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_year_id, number),
  CHECK (end_date > start_date)
);

ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation: periods" ON periods;
CREATE POLICY "School isolation: periods"
  ON periods FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_trimester_check;
ALTER TABLE grades ADD CONSTRAINT grades_trimester_check CHECK (trimester BETWEEN 1 AND 6);

ALTER TABLE bulletin_appreciations DROP CONSTRAINT IF EXISTS bulletin_appreciations_trimester_check;
ALTER TABLE bulletin_appreciations ADD CONSTRAINT bulletin_appreciations_trimester_check CHECK (trimester BETWEEN 1 AND 6);
