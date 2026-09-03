-- Cahier de textes simplifié : leçon du jour + devoir à faire, par classe
-- et matière. Écriture restreinte comme pour les notes/absences : un
-- enseignant ne peut écrire que sur ses classes/matières affectées
-- (teacher_subjects), le directeur n'est jamais concerné par cette
-- restriction. Lecture ouverte à tout le personnel de l'école, et en
-- lecture seule aux parents/élèves de la classe concernée.
--
-- À exécuter dans le SQL Editor Supabase, après 0017_absence_alert_threshold.sql.

CREATE TABLE lesson_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lesson_content TEXT NOT NULL,
  homework TEXT,
  homework_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lesson_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School isolation: lesson_logs select"
  ON lesson_logs FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "School isolation: lesson_logs insert"
  ON lesson_logs FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = lesson_logs.class_id
          AND ts.subject_id = lesson_logs.subject_id
      )
    )
  );

CREATE POLICY "School isolation: lesson_logs delete"
  ON lesson_logs FOR DELETE TO authenticated
  USING (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = lesson_logs.class_id
          AND ts.subject_id = lesson_logs.subject_id
      )
    )
  );

CREATE POLICY "Parent read own children classes: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = lesson_logs.class_id
    )
  );

CREATE POLICY "Student read own class: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = lesson_logs.class_id
    )
  );
