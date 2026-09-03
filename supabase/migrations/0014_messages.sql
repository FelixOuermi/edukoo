-- Messagerie simple, un fil de discussion par élève, entre le personnel
-- de l'école (directeur/enseignant, vue commune — pas de restriction
-- teacher_subjects ici, un message n'est pas une donnée pédagogique) et
-- les parents de cet élève. Pas de forum, pas de pièce jointe : un texte
-- horodaté, dans l'ordre chronologique.
--
-- À exécuter dans le SQL Editor Supabase, après 0013_announcements.sql.

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('staff', 'parent')),
  sender_name TEXT NOT NULL,
  sender_teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  sender_parent_id UUID REFERENCES parents(id)
    ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Le personnel voit et écrit sur le fil de n'importe quel élève de son
-- école (comme il voit déjà tout le dossier de l'élève sur sa fiche).
-- `sender_teacher_id = current_teacher_id()` empêche un membre du
-- personnel de se faire passer pour un collègue.
CREATE POLICY "School isolation: messages select"
  ON messages FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "Staff write: messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND sender_role = 'staff'
    AND sender_teacher_id = current_teacher_id()
  );

-- Un parent ne voit et n'écrit que sur le fil de ses propres enfants.
-- `sender_parent_id = current_parent_id()` empêche un parent de se faire
-- passer pour un autre parent ou pour le personnel.
CREATE POLICY "Parent read own children: messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = messages.student_id
    )
  );

CREATE POLICY "Parent write own children: messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'parent'
    AND sender_parent_id = current_parent_id()
    AND EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = messages.student_id
    )
  );
