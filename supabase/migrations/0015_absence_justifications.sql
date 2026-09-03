-- Workflow de justification d'absence : un parent peut soumettre un motif
-- pour l'absence de son enfant, que le personnel valide ou rejette.
-- `is_justified` (déjà existant) reste la source de vérité utilisée par
-- les bulletins ; il n'est modifié que par le personnel via l'approbation
-- (jamais directement par le parent, voir le trigger ci-dessous).
--
-- À exécuter dans le SQL Editor Supabase, après 0014_messages.sql.

ALTER TABLE absences
  ADD COLUMN IF NOT EXISTS justification_reason TEXT,
  ADD COLUMN IF NOT EXISTS justification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (justification_status IN ('none', 'pending', 'approved', 'rejected'));

-- RLS seule ne peut pas restreindre QUELS champs un parent modifie (juste
-- QUELLES lignes) : ce trigger empêche un parent d'utiliser son droit de
-- soumission de motif pour changer autre chose, en particulier
-- is_justified (qui resterait sinon sous son contrôle direct).
CREATE OR REPLACE FUNCTION guard_absence_parent_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_parent_id() IS NOT NULL THEN
    IF NEW.is_justified IS DISTINCT FROM OLD.is_justified
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.class_id IS DISTINCT FROM OLD.class_id
       OR NEW.absence_date IS DISTINCT FROM OLD.absence_date
       OR NEW.parent_notified IS DISTINCT FROM OLD.parent_notified
       OR NEW.justification_status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Un parent ne peut que soumettre un motif de justification (statut "pending").';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER absences_parent_update_guard
  BEFORE UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION guard_absence_parent_update();

-- Un parent peut soumettre un motif pour l'absence de son enfant (mais
-- pas se l'auto-approuver, voir trigger ci-dessus).
CREATE POLICY "Parent submit justification: absences"
  ON absences FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  );
