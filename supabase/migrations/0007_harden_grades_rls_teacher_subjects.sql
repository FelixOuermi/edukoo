-- Durcissement signalé dans le rapport d'audit après la vérification de
-- teacher_subjects : la restriction "un enseignant ne peut saisir que ses
-- classes/matières affectées" n'était appliquée que dans le Server Action
-- (saveGrades), pas dans la RLS de `grades`. Un appel direct à l'API
-- Supabase (hors interface Edukoo) pouvait donc contourner la restriction,
-- toujours à l'intérieur de la même école (pas de fuite inter-école).
--
-- La lecture (SELECT) reste inchangée — un enseignant peut toujours
-- consulter le dossier complet d'un élève, y compris les matières qu'il
-- n'enseigne pas ; seule l'écriture (INSERT/UPDATE/DELETE) est restreinte
-- à ses affectations. Le directeur n'est pas concerné, comme avant.

CREATE OR REPLACE FUNCTION current_teacher_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

DROP POLICY IF EXISTS "School isolation: grades" ON grades;

CREATE POLICY "School isolation: grades select"
  ON grades FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "School isolation: grades insert"
  ON grades FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );

CREATE POLICY "School isolation: grades update"
  ON grades FOR UPDATE TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );

CREATE POLICY "School isolation: grades delete"
  ON grades FOR DELETE TO authenticated
  USING (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );
