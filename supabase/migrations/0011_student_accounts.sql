-- Ajoute le compte élève : contrairement au parent (table séparée, un
-- parent peut avoir plusieurs enfants), un élève a déjà sa propre ligne
-- dans `students` — on y attache simplement `user_id`. Portée strictement
-- en lecture seule sur son propre dossier scolaire (notes, absences,
-- bulletins) ; la scolarité/paiements reste réservée au personnel et aux
-- parents, pas à l'élève.
--
-- Un élève dont `status <> 'active'` (suspendu, parti) perd tout accès,
-- comme un enseignant désactivé perd l'accès via is_active.
--
-- À exécuter dans le SQL Editor Supabase, après 0010_parents.sql.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Résout students.id du compte élève connecté.
CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM students WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

-- Résout l'école de l'élève connecté. Utilisée uniquement pour les
-- données de référence non sensibles (classes, matières, périodes),
-- jamais pour scoper des données propres à un autre élève.
CREATE OR REPLACE FUNCTION current_student_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM students WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

-- Un élève peut lire sa propre fiche, jamais la modifier depuis son
-- propre compte (la policy "School isolation: students" reste FOR ALL
-- mais scopée à current_school_id(), qui ne résout rien pour un élève).
CREATE POLICY "Student self read: students"
  ON students FOR SELECT TO authenticated
  USING (id = current_student_id());

CREATE POLICY "Student read own: grades"
  ON grades FOR SELECT TO authenticated
  USING (student_id = current_student_id());

CREATE POLICY "Student read own: absences"
  ON absences FOR SELECT TO authenticated
  USING (student_id = current_student_id());

CREATE POLICY "Student read own: bulletin_appreciations"
  ON bulletin_appreciations FOR SELECT TO authenticated
  USING (student_id = current_student_id());

-- Données de référence non sensibles, nécessaires pour afficher notes et
-- bulletins (noms de classes/matières/périodes).
CREATE POLICY "Student read school reference: classes"
  ON classes FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE POLICY "Student read school reference: subjects"
  ON subjects FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE POLICY "Student read school reference: class_subjects"
  ON class_subjects FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE POLICY "Student read school reference: school_years"
  ON school_years FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE POLICY "Student read school reference: periods"
  ON periods FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE POLICY "Student read school reference: grade_types"
  ON grade_types FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
