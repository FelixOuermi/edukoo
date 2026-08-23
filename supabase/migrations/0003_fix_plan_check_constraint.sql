-- URGENT : corrige une régression introduite par 0002_teacher_roles.sql.
--
-- La fonction handle_new_school_signup() a été remplacée par la version de
-- schema.sql, qui insère plan = 'trial' pour toute nouvelle école. Or la
-- contrainte schools_plan_check en production n'autorisait que
-- ('starter','school','premium') — 'trial' avait été retiré directement en
-- base à un moment donné, sans que schema.sql ne soit mis à jour en
-- conséquence. Résultat : depuis l'application de 0002, plus aucune
-- nouvelle école ne peut s'inscrire (l'insertion échoue, ce qui fait
-- échouer la création du compte auth.users tout entier).
--
-- Toute l'application suppose que 'trial' est un plan valide : la bannière
-- d'essai (src/app/dashboard/layout.tsx), le champ trial_ends_at (30 jours
-- par défaut), et la page d'inscription ("Essai gratuit 30 jours"). On
-- restaure donc 'trial' dans la contrainte plutôt que de le retirer du
-- trigger, ce qui préserverait l'essai gratuit tel que promis aux écoles.

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_plan_check;
ALTER TABLE schools ADD CONSTRAINT schools_plan_check
  CHECK (plan IN ('trial','starter','school','premium'));
