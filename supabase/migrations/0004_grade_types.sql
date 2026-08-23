-- Permet plusieurs notes pondérées par élève/matière/trimestre (devoir,
-- interrogation, composition...) au lieu d'une note unique. C'est le
-- constat le plus critique de l'audit notes/bulletins.
--
-- Chaque école définit ses propres "types de notes" (nom + poids). Une
-- note (`grades`) référence désormais un type ; la moyenne d'une matière
-- devient la moyenne pondérée des notes saisies pour cette matière, avant
-- application du coefficient de la matière (inchangé).

CREATE TABLE IF NOT EXISTS grade_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight DECIMAL(4,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grade_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "School isolation: grade_types" ON grade_types;
CREATE POLICY "School isolation: grade_types"
  ON grade_types FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Un type de note par défaut ("Devoir", poids 1) pour chaque école qui
-- n'en a pas encore, pour que les écoles existantes ne se retrouvent pas
-- bloquées sans aucun type disponible.
INSERT INTO grade_types (school_id, name, weight)
SELECT s.id, 'Devoir', 1
FROM schools s
WHERE NOT EXISTS (SELECT 1 FROM grade_types gt WHERE gt.school_id = s.id);

-- ON DELETE RESTRICT (pas CASCADE) : supprimer un type de note ne doit
-- jamais effacer silencieusement les notes qui l'utilisent.
ALTER TABLE grades ADD COLUMN IF NOT EXISTS grade_type_id UUID REFERENCES grade_types(id) ON DELETE RESTRICT;

-- Rattache chaque note existante au type par défaut de son école.
UPDATE grades g
SET grade_type_id = (
  SELECT gt.id FROM grade_types gt
  WHERE gt.school_id = g.school_id
  ORDER BY gt.created_at ASC
  LIMIT 1
)
WHERE grade_type_id IS NULL;

ALTER TABLE grades ALTER COLUMN grade_type_id SET NOT NULL;

-- Remplace l'ancienne contrainte unique (une seule note par matière/
-- trimestre) par une contrainte incluant le type de note, quel que soit
-- son nom exact généré par Postgres.
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  WHERE c.conrelid = 'public.grades'::regclass
    AND c.contype = 'u'
    AND (
      SELECT array_agg(a.attname::text ORDER BY a.attname)
      FROM unnest(c.conkey) AS k(attnum)
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    ) = ARRAY['school_year_id','student_id','subject_id','trimester']::text[]
  LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.grades DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_unique_entry;
ALTER TABLE grades ADD CONSTRAINT grades_unique_entry
  UNIQUE (student_id, subject_id, school_year_id, trimester, grade_type_id);

-- Chaque nouvelle école part avec un type de note par défaut.
CREATE OR REPLACE FUNCTION handle_new_school_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
BEGIN
  IF NEW.raw_user_meta_data ? 'school_name' THEN
    INSERT INTO schools (name, director_name, email, plan)
    VALUES (
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'trial'
    )
    RETURNING id INTO new_school_id;

    INSERT INTO teachers (school_id, user_id, name, email, role)
    VALUES (
      new_school_id,
      NEW.id,
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'director'
    );

    INSERT INTO grade_types (school_id, name, weight)
    VALUES (new_school_id, 'Devoir', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
