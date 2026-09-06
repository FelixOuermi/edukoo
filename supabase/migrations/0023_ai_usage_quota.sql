-- Quota d'usage quotidien pour les fonctions IA (src/lib/ai.ts), par école
-- et par jour. Corrige un vrai trou du chantier IA du 2026-09-06 : rien
-- n'empêchait un directeur de cliquer en boucle sur "Générer une synthèse"
-- et de consommer de l'API à chaque clic. Limite fixée selon le plan
-- payant de l'école plutôt qu'une limite unique — cohérent avec la logique
-- tarifaire existante (schools.plan).
--
-- À exécuter dans le SQL Editor Supabase, après 0022_education_levels.sql.

CREATE TABLE ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, usage_date)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School isolation: ai_usage"
  ON ai_usage FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Incrémentation atomique avec vérification de seuil en une seule
-- opération : le UPDATE (branche ON CONFLICT) ne s'applique que si le
-- compteur actuel est encore sous la limite, ce qui évite la fenêtre de
-- course d'un schéma lire-puis-écrire séparé (deux clics quasi
-- simultanés ne doivent pas tous les deux passer). Retourne TRUE si
-- l'appel est autorisé (et compté), FALSE si le quota du jour est atteint.
CREATE OR REPLACE FUNCTION consume_ai_quota(target_school_id UUID, daily_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  result_count INTEGER;
BEGIN
  INSERT INTO ai_usage (school_id, usage_date, count)
  VALUES (target_school_id, CURRENT_DATE, 1)
  ON CONFLICT (school_id, usage_date)
  DO UPDATE SET count = ai_usage.count + 1
  WHERE ai_usage.count < daily_limit
  RETURNING count INTO result_count;

  RETURN result_count IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
