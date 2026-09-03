-- Ajoute le rôle parent : un compte séparé du personnel (teachers), lié à
-- un ou plusieurs élèves via parent_students. Portée volontairement
-- restreinte à la lecture seule : un parent ne peut jamais écrire dans le
-- dossier de ses enfants depuis ce compte.
--
-- Un parent n'a PAS accès à toute l'école comme un enseignant : ses
-- policies RLS sont scopées à ses propres enfants (via parent_students),
-- sauf pour les données de référence non sensibles (classes, matières,
-- années scolaires, périodes) où l'isolement reste au niveau école.
--
-- À exécuter dans le SQL Editor Supabase, après 0009_audit_log.sql.

CREATE TABLE parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liaison parent <-> élève (plusieurs enfants par parent, plusieurs
-- responsables par élève possible : parent + tuteur par ex.)
CREATE TABLE parent_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, student_id)
);

-- Empêche de lier un parent ou un élève d'une autre école (le row lui-même
-- pourrait avoir school_id = current_school_id() du directeur qui crée le
-- lien, mais parent_id/student_id référencer une autre école par erreur ou
-- via un appel REST direct).
CREATE OR REPLACE FUNCTION guard_parent_students_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM parents p
    WHERE p.id = NEW.parent_id AND p.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'parent_id doit appartenir à la même école.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id AND s.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'student_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER parent_students_school_consistency_guard
  BEFORE INSERT OR UPDATE ON parent_students
  FOR EACH ROW
  EXECUTE FUNCTION guard_parent_students_school_consistency();

-- Résout parents.id du compte parent connecté (analogue à
-- current_teacher_id() pour le personnel).
CREATE OR REPLACE FUNCTION current_parent_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM parents WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Résout l'école du compte parent connecté. Utilisée uniquement pour les
-- données de référence non sensibles (classes, matières, périodes) : ne
-- jamais l'utiliser pour scoper des données propres à un élève (voir
-- current_parent_id() + parent_students pour ça).
CREATE OR REPLACE FUNCTION current_parent_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM parents WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;

-- Gestion des comptes parents : réservée au personnel de l'école
-- (director/teacher), comme pour teachers.
CREATE POLICY "School isolation: parents"
  ON parents FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Un parent peut lire sa propre fiche.
CREATE POLICY "Parent self read: parents"
  ON parents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Gestion des liens parent-élève : réservée au personnel de l'école.
CREATE POLICY "School isolation: parent_students"
  ON parent_students FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Un parent peut lire la liste de ses propres enfants liés.
CREATE POLICY "Parent self read: parent_students"
  ON parent_students FOR SELECT TO authenticated
  USING (parent_id = current_parent_id());

-- Un parent peut lire uniquement les fiches de ses propres enfants (pas
-- toute l'école comme un enseignant).
CREATE POLICY "Parent read own children: students"
  ON students FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = students.id
    )
  );

CREATE POLICY "Parent read own children: grades"
  ON grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = grades.student_id
    )
  );

CREATE POLICY "Parent read own children: absences"
  ON absences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  );

CREATE POLICY "Parent read own children: bulletin_appreciations"
  ON bulletin_appreciations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = bulletin_appreciations.student_id
    )
  );

CREATE POLICY "Parent read own children: fee_payments"
  ON fee_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = fee_payments.student_id
    )
  );

CREATE POLICY "Parent read own children classes fees: fee_structures"
  ON fee_structures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = fee_structures.class_id
    )
  );

-- Données de référence non sensibles : lecture au niveau école pour un
-- parent (noms de classes/matières/périodes, nécessaires pour afficher
-- notes et bulletins).
CREATE POLICY "Parent read school reference: classes"
  ON classes FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Parent read school reference: subjects"
  ON subjects FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Parent read school reference: class_subjects"
  ON class_subjects FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Parent read school reference: school_years"
  ON school_years FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Parent read school reference: periods"
  ON periods FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Parent read school reference: grade_types"
  ON grade_types FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
