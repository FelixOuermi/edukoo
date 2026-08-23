-- Ajoute les rôles au personnel : 'director' (accès complet) / 'teacher'
-- (accès restreint). Le premier compte de chaque école (celui créé par le
-- trigger d'inscription) devient 'director'.
--
-- Ajoute aussi deux garde-fous :
-- 1. current_school_id() ignore désormais les comptes désactivés
--    (is_active = false) : un enseignant désactivé perd tout accès.
-- 2. Un trigger empêche quiconque n'est pas 'director' de modifier le rôle
--    ou le statut actif/inactif d'une ligne teachers (sinon un enseignant
--    pourrait s'auto-promouvoir directeur via un appel REST direct, la RLS
--    n'étant scopée qu'au niveau école).
--
-- À exécuter dans le SQL Editor Supabase, après 0001_fix_tenant_isolation.sql.

ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'teacher'
    CHECK (role IN ('director', 'teacher'));

UPDATE teachers t
SET role = 'director'
WHERE role = 'teacher'
  AND t.id = (
    SELECT t2.id FROM teachers t2
    WHERE t2.school_id = t.school_id
    ORDER BY t2.created_at ASC
    LIMIT 1
  );

CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION current_teacher_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION guard_teacher_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active)
     AND COALESCE(current_teacher_role(), '') <> 'director' THEN
    RAISE EXCEPTION 'Seul un directeur peut modifier le rôle ou le statut du personnel.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS teachers_privileged_fields_guard ON teachers;
CREATE TRIGGER teachers_privileged_fields_guard
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION guard_teacher_privileged_fields();

-- Le trigger de provisionnement à l'inscription pose désormais le rôle
-- 'director' explicitement (au lieu de compter sur le défaut + le backfill
-- ci-dessus, qui ne concerne que les écoles déjà existantes).
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
