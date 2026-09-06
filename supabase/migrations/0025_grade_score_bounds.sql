-- Garde-fou d'intégrité sur les notes, absent jusqu'ici à tous les
-- niveaux : le formulaire avait bien min=0/max=20 en HTML mais c'est
-- contournable (outils navigateur, ou tout appel direct qui n'utilise
-- pas la soumission native du <form>, comme le rejeu de la file
-- hors-ligne src/lib/offline-queue.ts) ; l'import Excel et les Server
-- Actions ne vérifiaient que "est-ce un nombre", jamais la plage. Trouvé
-- en testant en production le 2026-09-06 : une valeur de 999 était
-- acceptée sans erreur et faussait moyenne d'élève et moyenne de classe.
--
-- Vérifié avant d'ajouter cette contrainte : aucune des 361 lignes
-- existantes de `grades` en production ne la viole (script de contrôle
-- exécuté séparément, pas de migration de nettoyage nécessaire).
--
-- À exécuter dans le SQL Editor Supabase, après 0024_payroll.sql.

ALTER TABLE grades
  ADD CONSTRAINT grades_score_within_max_score
  CHECK (score IS NULL OR (score >= 0 AND score <= max_score));

ALTER TABLE grades
  ADD CONSTRAINT grades_max_score_positive
  CHECK (max_score > 0);
