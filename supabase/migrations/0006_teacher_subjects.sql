-- Dernier constat "Critique" de l'audit resté ouvert depuis la Phase 2 :
-- rien ne permettait de dire "cet enseignant enseigne les Mathématiques en
-- 6ème A" — un enseignant voyait donc toutes les classes/matières de
-- l'école, pas seulement les siennes.
--
-- teacher_subjects (enseignant × classe × matière) restreint désormais,
-- pour un compte 'teacher', les classes/matières visibles dans Notes et
-- Absences à ses affectations. Un 'director' n'est pas concerné : il
-- continue de tout voir, comme avant.

CREATE TABLE IF NOT EXISTS teacher_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, class_id, subject_id)
);

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "School isolation: teacher_subjects" ON teacher_subjects;
CREATE POLICY "School isolation: teacher_subjects"
  ON teacher_subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
