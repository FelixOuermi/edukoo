-- Annonces de l'école : actualités visibles par tout le monde (personnel,
-- parents, élèves), publiées par le directeur uniquement (pour éviter le
-- bruit — contrairement à la fiche élève où tout le personnel peut agir).
--
-- À exécuter dans le SQL Editor Supabase, après 0012_timetable.sql.

CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School isolation: announcements select"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "Director manage: announcements insert"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director manage: announcements update"
  ON announcements FOR UPDATE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director manage: announcements delete"
  ON announcements FOR DELETE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Parent read school reference: announcements"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());

CREATE POLICY "Student read school reference: announcements"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
