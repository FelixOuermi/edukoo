-- Module discipline : sanctions/observations liées à un élève, distinctes
-- des absences, visibles dans son "carnet" (fiche élève côté personnel,
-- portail parent/élève en lecture seule).
--
-- À exécuter dans le SQL Editor Supabase, après 0015_absence_justifications.sql.

CREATE TABLE disciplinary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('remark', 'warning', 'detention', 'suspension')),
  description TEXT NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;

-- Le personnel gère les sanctions de n'importe quel élève de son école
-- (comme pour les messages : ce n'est pas une donnée pédagogique
-- cloisonnée par teacher_subjects).
CREATE POLICY "School isolation: disciplinary_records"
  ON disciplinary_records FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "Parent read own children: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = disciplinary_records.student_id
    )
  );

CREATE POLICY "Student read own: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (student_id = current_student_id());
