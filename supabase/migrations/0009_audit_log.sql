-- Dernier constat "Moyen" de l'audit paramètres/personnel : aucun moyen de
-- savoir qui a changé quoi. audit_log enregistre les actions sensibles
-- (changement de rôle, activation/désactivation, invitation, suppression
-- d'élève, paiement enregistré) avec l'auteur, une description lisible et
-- un horodatage. Lecture réservée au directeur (côté application).

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "School isolation: audit_log" ON audit_log;
CREATE POLICY "School isolation: audit_log"
  ON audit_log FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
