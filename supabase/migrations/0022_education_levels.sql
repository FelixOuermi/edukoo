-- Modèle scolaire structuré : cycle → niveau, en remplacement du champ
-- texte libre `classes.level` pour les nouvelles classes. Référentiel par
-- école (comme grade_types), pas un référentiel national unique : les
-- séries technique/professionnel varient trop d'un établissement à
-- l'autre pour être figées en dur ici. Chaque école part avec un jeu de
-- cycles/niveaux par défaut (secondaire général burkinabè) que le
-- directeur peut compléter (ex. séries techniques propres à son lycée).
--
-- `classes.level` (texte libre) est conservé comme repli d'affichage pour
-- les classes créées avant cette migration et jamais rattachées à un
-- niveau structuré — pas supprimé, pour ne pas perdre l'information des
-- écoles déjà en production tant que le rattachement n'est pas confirmé.
--
-- À exécuter dans le SQL Editor Supabase, après 0021_fix_cross_tenant_isolation.sql.

CREATE TABLE education_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE TABLE education_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  cycle_id UUID REFERENCES education_cycles(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cycle_id, name)
);

ALTER TABLE classes
  ADD COLUMN education_level_id UUID REFERENCES education_levels(id)
    ON DELETE SET NULL;

ALTER TABLE education_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_levels ENABLE ROW LEVEL SECURITY;

-- Même régime que classes/subjects : tout le personnel de l'école
-- (directeur ou enseignant) peut lire ; la création/suppression est
-- restreinte au directeur au niveau applicatif (comme grade_types),
-- pas ici, pour rester cohérent avec le reste du référentiel pédagogique.
CREATE POLICY "School isolation: education_cycles"
  ON education_cycles FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: education_levels"
  ON education_levels FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Données de référence non sensibles : lecture au niveau école pour un
-- parent ou un élève (nécessaire pour afficher le niveau d'une classe).
CREATE POLICY "Parent read school reference: education_cycles"
  ON education_cycles FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: education_cycles"
  ON education_cycles FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: education_levels"
  ON education_levels FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: education_levels"
  ON education_levels FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

-- Seed par défaut (secondaire général burkinabè) pour les nouvelles
-- écoles, appelée à la fois par le trigger de signup ci-dessous et par
-- le backfill des écoles existantes juste après.
CREATE OR REPLACE FUNCTION seed_default_education_levels(target_school_id UUID)
RETURNS VOID AS $$
DECLARE
  post_primaire_id UUID;
  secondaire_id UUID;
  technique_id UUID;
BEGIN
  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Post-primaire', 1)
  RETURNING id INTO post_primaire_id;

  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Secondaire général', 2)
  RETURNING id INTO secondaire_id;

  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Enseignement technique et professionnel', 3)
  RETURNING id INTO technique_id;

  INSERT INTO education_levels (school_id, cycle_id, name, display_order) VALUES
    (target_school_id, post_primaire_id, '6e', 1),
    (target_school_id, post_primaire_id, '5e', 2),
    (target_school_id, post_primaire_id, '4e', 3),
    (target_school_id, post_primaire_id, '3e', 4),
    (target_school_id, secondaire_id, '2nde A', 1),
    (target_school_id, secondaire_id, '2nde C', 2),
    (target_school_id, secondaire_id, '1ère A', 3),
    (target_school_id, secondaire_id, '1ère C', 4),
    (target_school_id, secondaire_id, '1ère D', 5),
    (target_school_id, secondaire_id, 'Terminale A', 6),
    (target_school_id, secondaire_id, 'Terminale C', 7),
    (target_school_id, secondaire_id, 'Terminale D', 8);
  -- Le cycle technique/professionnel démarre volontairement sans niveau
  -- prérempli : les séries (G1, G2, F1-F4, CAP, BEP...) sont trop
  -- spécifiques à chaque lycée technique pour un défaut national fiable.
  -- Le directeur les ajoute lui-même depuis Classes & Matières.
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_school_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
BEGIN
  IF NEW.raw_user_meta_data ? 'school_name' THEN
    INSERT INTO schools (name, director_name, email, plan)
    VALUES (
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'trial'
    )
    RETURNING id INTO new_school_id;

    INSERT INTO teachers (school_id, user_id, name, email, role)
    VALUES (
      new_school_id,
      NEW.id,
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'director'
    );

    INSERT INTO grade_types (school_id, name, weight)
    VALUES (new_school_id, 'Devoir', 1);

    PERFORM seed_default_education_levels(new_school_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill : écoles déjà en production, créées avant cette migration.
DO $$
DECLARE
  s RECORD;
BEGIN
  FOR s IN SELECT id FROM schools LOOP
    PERFORM seed_default_education_levels(s.id);
  END LOOP;
END $$;

-- Rattachement automatique des classes existantes : uniquement quand le
-- texte libre `classes.level` correspond exactement (insensible à la
-- casse/espaces) au nom d'un niveau nouvellement créé pour la même école.
-- Les classes sans correspondance gardent `education_level_id` NULL et
-- affichent leur ancien texte en repli — à rattacher manuellement depuis
-- Classes & Matières.
UPDATE classes c
SET education_level_id = el.id
FROM education_levels el
WHERE el.school_id = c.school_id
  AND c.level IS NOT NULL
  AND lower(trim(c.level)) = lower(trim(el.name))
  AND c.education_level_id IS NULL;
