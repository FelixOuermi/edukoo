-- Corrige une faille d'isolation multi-tenant relevée par audit de
-- sécurité : messages, disciplinary_records, lesson_logs et
-- timetable_slots permettaient à un directeur/enseignant d'insérer une
-- ligne avec un student_id/class_id appartenant à une AUTRE école tout en
-- gardant son propre school_id. Les policies RLS de lecture parent/élève
-- de ces 4 tables ne comparaient que student_id/class_id (jamais
-- school_id), donc une telle ligne devenait visible par les vrais
-- parents/élèves de l'école ciblée — usurpation de communication
-- (messages), fausses sanctions disciplinaires, faux devoirs ou faux
-- créneaux d'emploi du temps injectés depuis un tenant étranger.
--
-- Correctif à deux niveaux, sur le modèle du trigger déjà existant pour
-- parent_students (0010_parents.sql) :
--   1. Un trigger BEFORE INSERT/UPDATE empêche désormais la création
--      d'une ligne incohérente à la source (la vérification applicative
--      côté Server Action a aussi été ajoutée en parallèle, mais la RLS
--      doit rester la ligne de défense ultime en cas d'appel direct à
--      l'API Supabase).
--   2. Les policies de lecture parent/élève sont durcies pour vérifier
--      explicitement que l'école de la ligne correspond bien à l'école
--      réelle de l'élève/de la classe référencée.
--
-- À exécuter dans le SQL Editor Supabase, après 0020_rooms.sql.

CREATE OR REPLACE FUNCTION guard_row_student_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id AND s.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'student_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION guard_row_class_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = NEW.class_id AND c.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'class_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS messages_school_consistency_guard ON messages;
CREATE TRIGGER messages_school_consistency_guard
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_student_school_consistency();

DROP TRIGGER IF EXISTS disciplinary_records_school_consistency_guard ON disciplinary_records;
CREATE TRIGGER disciplinary_records_school_consistency_guard
  BEFORE INSERT OR UPDATE ON disciplinary_records
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_student_school_consistency();

DROP TRIGGER IF EXISTS lesson_logs_school_consistency_guard ON lesson_logs;
CREATE TRIGGER lesson_logs_school_consistency_guard
  BEFORE INSERT OR UPDATE ON lesson_logs
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_class_school_consistency();

DROP TRIGGER IF EXISTS timetable_slots_school_consistency_guard ON timetable_slots;
CREATE TRIGGER timetable_slots_school_consistency_guard
  BEFORE INSERT OR UPDATE ON timetable_slots
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_class_school_consistency();

-- Durcissement des policies de lecture parent/élève : vérifient désormais
-- que l'école de la ligne correspond bien à l'école réelle de l'élève/de
-- la classe, en plus de la relation elle-même.

DROP POLICY IF EXISTS "Parent read own children: messages" ON messages;
CREATE POLICY "Parent read own children: messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = messages.student_id
        AND s.school_id = messages.school_id
    )
  );

DROP POLICY IF EXISTS "Parent read own children: disciplinary_records" ON disciplinary_records;
CREATE POLICY "Parent read own children: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = disciplinary_records.student_id
        AND s.school_id = disciplinary_records.school_id
    )
  );

DROP POLICY IF EXISTS "Student read own: disciplinary_records" ON disciplinary_records;
CREATE POLICY "Student read own: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (
    student_id = current_student_id()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = disciplinary_records.student_id
        AND s.school_id = disciplinary_records.school_id
    )
  );

DROP POLICY IF EXISTS "Parent read own children classes: lesson_logs" ON lesson_logs;
CREATE POLICY "Parent read own children classes: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = lesson_logs.class_id
        AND s.school_id = lesson_logs.school_id
    )
  );

DROP POLICY IF EXISTS "Student read own class: lesson_logs" ON lesson_logs;
CREATE POLICY "Student read own class: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = lesson_logs.class_id
        AND s.school_id = lesson_logs.school_id
    )
  );

DROP POLICY IF EXISTS "Parent read own children classes: timetable_slots" ON timetable_slots;
CREATE POLICY "Parent read own children classes: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = timetable_slots.class_id
        AND s.school_id = timetable_slots.school_id
    )
  );

DROP POLICY IF EXISTS "Student read own class: timetable_slots" ON timetable_slots;
CREATE POLICY "Student read own class: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = timetable_slots.class_id
        AND s.school_id = timetable_slots.school_id
    )
  );
