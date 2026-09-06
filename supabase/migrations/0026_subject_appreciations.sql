-- Un vrai bulletin de lycée porte une appréciation par matière (rédigée par
-- l'enseignant de la matière), pas seulement une appréciation générale de
-- l'élève. bulletin_appreciations gagne une colonne subject_id nullable :
-- NULL = appréciation générale (comportement existant, inchangé), non-NULL =
-- appréciation d'une matière précise pour ce trimestre.

ALTER TABLE bulletin_appreciations ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE;

-- L'ancienne contrainte UNIQUE(student_id, school_year_id, trimester) ne
-- laissait qu'une seule ligne par élève/année/trimestre, quelle que soit la
-- matière : incompatible avec plusieurs appréciations par matière pour le
-- même élève. Retrouvée par introspection plutôt que par son nom généré
-- par défaut (fragile), sur le modèle déjà utilisé dans 0004_grade_types.sql.
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  WHERE c.conrelid = 'public.bulletin_appreciations'::regclass
    AND c.contype = 'u'
    AND (
      SELECT array_agg(a.attname::text ORDER BY a.attname)
      FROM unnest(c.conkey) AS k(attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    ) = ARRAY['school_year_id','student_id','trimester']::text[]
  LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.bulletin_appreciations DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Remplacée par deux index uniques partiels : au plus une appréciation
-- générale (subject_id NULL) et au plus une appréciation par matière
-- (subject_id non NULL) par élève/année/trimestre.
CREATE UNIQUE INDEX IF NOT EXISTS bulletin_appreciations_general_unique
  ON bulletin_appreciations (student_id, school_year_id, trimester)
  WHERE subject_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bulletin_appreciations_subject_unique
  ON bulletin_appreciations (student_id, school_year_id, trimester, subject_id)
  WHERE subject_id IS NOT NULL;
