-- Emploi du temps : créneaux hebdomadaires par classe. La détection de
-- conflit (même enseignant ou même salle sur deux créneaux qui se
-- chevauchent) est faite côté application (Server Action), pas en SQL —
-- comme le reste du code (ex. doublon de lien parent-élève), pour rester
-- cohérent avec le style existant plutôt que d'introduire une extension
-- Postgres (btree_gist) pour une contrainte d'exclusion.
--
-- À exécuter dans le SQL Editor Supabase, après 0011_student_accounts.sql.

CREATE TABLE timetable_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = lundi ... 7 = dimanche
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le personnel de l'école (un enseignant doit pouvoir
-- consulter son propre planning, potentiellement réparti sur plusieurs
-- classes qu'il n'enseigne pas forcément toutes via teacher_subjects).
CREATE POLICY "School isolation: timetable_slots select"
  ON timetable_slots FOR SELECT TO authenticated
  USING (school_id = current_school_id());

-- Écriture : réservée au directeur (la page enseignant est en lecture
-- seule, voir commentaire ci-dessus).
CREATE POLICY "Director manage: timetable_slots insert"
  ON timetable_slots FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director manage: timetable_slots update"
  ON timetable_slots FOR UPDATE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director manage: timetable_slots delete"
  ON timetable_slots FOR DELETE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director');

-- Un parent peut consulter l'emploi du temps des classes de ses enfants.
CREATE POLICY "Parent read own children classes: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = timetable_slots.class_id
    )
  );

-- Un élève peut consulter l'emploi du temps de sa propre classe.
CREATE POLICY "Student read own class: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = timetable_slots.class_id
    )
  );
