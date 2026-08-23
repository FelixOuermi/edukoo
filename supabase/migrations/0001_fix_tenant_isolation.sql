-- Corrige l'isolation multi-tenant : les policies RLS actuelles autorisent
-- tout utilisateur authentifié à lire/écrire les données de N'IMPORTE QUELLE
-- école (USING (true), sans filtre school_id). Cette migration restreint
-- chaque table aux lignes de l'école de l'utilisateur connecté.
--
-- À exécuter une fois sur la base de production existante, via le SQL
-- Editor du dashboard Supabase (Project > SQL Editor > New query), ou avec
-- `supabase db push` si la CLI est configurée.

CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM teachers WHERE user_id = auth.uid() LIMIT 1;
$$;

DROP POLICY IF EXISTS "Auth access schools" ON schools;
DROP POLICY IF EXISTS "Auth access school_years" ON school_years;
DROP POLICY IF EXISTS "Auth access classes" ON classes;
DROP POLICY IF EXISTS "Auth access subjects" ON subjects;
DROP POLICY IF EXISTS "Auth access teachers" ON teachers;
DROP POLICY IF EXISTS "Auth access students" ON students;
DROP POLICY IF EXISTS "Auth access fee_structures" ON fee_structures;
DROP POLICY IF EXISTS "Auth access fee_payments" ON fee_payments;
DROP POLICY IF EXISTS "Auth access grades" ON grades;
DROP POLICY IF EXISTS "Auth access absences" ON absences;

CREATE POLICY "School isolation: schools"
  ON schools FOR ALL TO authenticated
  USING (id = current_school_id())
  WITH CHECK (id = current_school_id());

CREATE POLICY "School isolation: school_years"
  ON school_years FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: classes"
  ON classes FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: subjects"
  ON subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: teachers"
  ON teachers FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: students"
  ON students FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: fee_structures"
  ON fee_structures FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: fee_payments"
  ON fee_payments FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: grades"
  ON grades FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: absences"
  ON absences FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Note : current_school_id() est SECURITY DEFINER, donc elle lit la table
-- teachers en contournant sa propre RLS (pas de récursion infinie possible).
-- Un utilisateur sans ligne dans teachers (cas normalement impossible via
-- l'app) obtient school_id = NULL, donc aucun accès nulle part.
