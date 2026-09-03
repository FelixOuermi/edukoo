-- Seuil configurable par école pour l'alerte d'absentéisme (nombre
-- d'absences dans le mois calendaire à partir duquel les parents et le
-- personnel sont notifiés). Réglable dans Paramètres.
--
-- À exécuter dans le SQL Editor Supabase, après 0016_discipline.sql.

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS absence_alert_threshold INTEGER NOT NULL DEFAULT 4
    CHECK (absence_alert_threshold > 0);
