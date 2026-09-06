# Dossier de tâches Edukoo — comparatif & feuille de route

*Créé le 2026-09-03. À traiter au fil de l'eau : on coche, on ajoute, on reclasse.*

## Méthode

Comparaison de l'état actuel d'Edukoo avec :
- **Scolaire (collège/lycée)** : Pronote (Index Éducation, référence en France), EcoleDirecte, Skolengo — logiciels de "vie scolaire" les plus utilisés.
- **Universitaire** : Apogée (gestion des inscriptions/cursus en France), HYPERPLANNING (emplois du temps complexes), Moodle/Canvas (LMS), Ellucian Banner / PeopleSoft Campus Solutions (ERP complet).

Edukoo aujourd'hui est un **logiciel de gestion administrative secondaire** (classes fixes, bulletins trimestriels, coefficients, scolarité/paiements), pas un LMS ni un ERP universitaire. Le comparatif université sert donc surtout à statuer sur si/quand ce marché est visé — voir section "Question stratégique" en bas.

---

## État actuel d'Edukoo (référence)

| Domaine | Existant |
|---|---|
| Multi-tenant / auth | Écoles isolées par RLS, plans d'abonnement |
| Rôles | `director` (accès total), `teacher` (cloisonné par matière/classe) |
| Élèves / classes / matières | CRUD complet, coefficients par classe |
| Notes | Types pondérés (devoir, composition…), périodes configurables |
| Absences | Table basique, saisie |
| Bulletins | PDF avec logo, appréciations, coefficients |
| Scolarité | Frais, paiements, reçus PDF |
| Import/export | Excel (notes, absences, appréciations), export global |
| Audit | Journal des actions |

**Rôles absents : élève, parent.** Aucun portail pour eux — c'est le trou le plus structurant.

---

## Comparatif fonctionnel et écarts

| Domaine | Pronote / EcoleDirecte / Skolengo | Edukoo | Écart |
|---|---|---|---|
| Portail parent/élève | Compte dédié, appli mobile, consultation notes/absences/bulletins en temps réel | **Absent** | 🔴 Critique |
| Emploi du temps | Génération, consultation par classe/prof/élève, salles | **Absent** | 🔴 Critique |
| Messagerie interne | Enseignant ↔ parent ↔ direction, notifications push/email | **Absent** (Resend seulement pour invitation staff) | 🔴 Critique |
| Cahier de textes / devoirs | Suivi leçons faites, devoirs à venir, ressources jointes | **Absent** | 🟠 Important |
| Vie scolaire / discipline | Sanctions, retenues, mots dans le carnet, suivi par élève | **Absent** (seules les absences existent) | 🟠 Important |
| Absences — workflow | Justification par parent, motifs, alertes seuils, retards | Saisie simple sans workflow | 🟠 Important |
| Documents administratifs | Certificats de scolarité, attestations, convocations | Seuls bulletins + reçus | 🟠 Important |
| Statistiques / pilotage | Taux de réussite, moyennes comparatives, tableaux de bord direction | **Absent** | 🟡 Utile |
| Notifications automatiques | SMS/email sur note, absence, paiement | **Absent** | 🟡 Utile |
| Cantine / transport / internat | Modules optionnels intégrés | **Absent** | 🟢 Optionnel |
| Gestion des salles/ressources | Réservation, conflits | **Absent** | 🟢 Optionnel |
| Multi-langue (i18n) | Oui (marché international) | **Absent** (FR uniquement dans le code) | 🟡 Utile si expansion |
| App mobile / API publique | Oui | **Absent** | 🟢 Optionnel |
| **— Volet universitaire —** | Apogée / HYPERPLANNING / Moodle | Edukoo | |
| Crédits ECTS / UE | Cursus modulaire, capitalisation | **Absent** | ⚪ Hors périmètre actuel |
| Inscription pédagogique à la carte | Choix d'options/parcours par étudiant | **Absent** | ⚪ Hors périmètre actuel |
| Jury de délibération / compensation | Workflow de décision de passage | **Absent** | ⚪ Hors périmètre actuel |
| Emploi du temps multi-groupes (TD/TP) | Contraintes complexes, optionnelles | **Absent** | ⚪ Hors périmètre actuel |
| LMS (cours en ligne, devoirs numériques, quiz) | Moodle/Canvas | **Absent** | ⚪ Hors périmètre actuel |

Légende : 🔴 critique (bloque l'adoption/rétention) · 🟠 important (attendu par les écoles) · 🟡 utile (différenciant) · 🟢 optionnel (scale) · ⚪ hors périmètre secondaire.

---

## Dossier de tâches (à traiter chaque jour)

Chaque case = une tâche de taille session (quelques heures max). On coche au fur et à mesure ; on réordonne librement selon les retours clients.

### P0 — Portail parent/élève (le manque le plus structurant) ✅ terminé
- [x] Modéliser le rôle `parent` et la table de liaison `parent_students` (un parent → plusieurs enfants, RLS dédiée) — `supabase/migrations/0010_parents.sql`
- [x] Modéliser le rôle `student` (compte élève, lecture seule sur ses propres données) — `supabase/migrations/0011_student_accounts.sql`
- [x] Page d'invitation parent (par le directeur ou l'enseignant) — invitation Supabase Auth + liaison `parent_students` depuis la fiche élève (`src/app/dashboard/eleves/parent-actions.ts`, `parent-section.tsx`). *Note : utilise `admin.auth.admin.inviteUserByEmail` (comme l'invitation enseignant existante), pas le paquet `resend` — ce dernier n'était déjà pas utilisé dans le code pour les enseignants non plus.*
- [x] Dashboard parent : consultation notes de son/ses enfant(s) par période — `src/app/espace-parent/[studentId]/page.tsx`
- [x] Dashboard parent : consultation absences + bulletins PDF téléchargeables — même page + `src/app/espace-parent/[studentId]/bulletin/route.tsx`
- [x] Dashboard parent : suivi des paiements de scolarité (solde, échéances) — même page (montant dû / payé / solde)
- [x] Auth : flux de connexion séparé parent/élève vs personnel — `signIn` route désormais vers `/dashboard`, `/espace-parent` ou `/espace-eleve` selon le compte (`src/app/auth/actions.ts`) ; `getCurrentSchool()` redirige aussi un parent/élève qui atterrit sur `/dashboard` vers son portail. Portail élève (`/espace-eleve`) livré en bonus au passage : même lecture seule (notes, absences, bulletin PDF), un seul dossier (le sien).

### P0 — Emploi du temps ✅ terminé
- [x] Modéliser `timetable_slots` (classe, matière, enseignant, jour, créneau, salle optionnelle) — `supabase/migrations/0012_timetable.sql`
- [x] Page directeur : création/édition par classe — `src/app/dashboard/emploi-du-temps/` (édition = retrait + recréation, comme les affectations enseignant existantes)
- [x] Page enseignant : vue de son propre emploi du temps — même page, lecture seule, filtrée sur ses créneaux
- [x] Vue emploi du temps dans le portail parent/élève — ajoutée sur les pages `espace-parent/[studentId]` et `espace-eleve`
- [x] Détection de conflits (même classe/enseignant/salle sur un créneau qui chevauche) — vérifiée côté Server Action avant insertion, `src/app/dashboard/emploi-du-temps/actions.ts`

### P0 — Communication de base ✅ terminé
- [x] Notifications email automatiques : nouvelle note publiée, absence enregistrée, paiement reçu — `src/lib/email.ts` (wrapper Resend, enfin utilisé — jusqu'ici la dépendance était installée mais inemployée), `src/lib/notifications.ts`, câblés en best-effort via `after()` dans `notes/actions.ts`, `absences/actions.ts`, `scolarite/actions.ts`. Import Excel des notes volontairement exclu (pas un événement "nouvelle note" en temps réel). La colonne `absences.parent_notified`, déjà présente dans le schéma mais jamais utilisée jusqu'ici, est maintenant renseignée correctement.
- [x] Messagerie simple enseignant → parent (fil par élève) — table `messages` (`supabase/migrations/0014_messages.sql`), intégrée sur la fiche élève staff et sur `espace-parent/[studentId]`.
- [x] Journal des annonces de l'école — table `announcements` (`supabase/migrations/0013_announcements.sql`), page `dashboard/annonces` (publication réservée au directeur), affichées sur les accueils `espace-parent` et `espace-eleve`.

### P1 — Vie scolaire ✅ terminé
- [x] Workflow de justification d'absence (parent soumet un motif, directeur/enseignant valide) — `supabase/migrations/0015_absence_justifications.sql` (colonnes + trigger de garde empêchant un parent de s'auto-justifier), UI sur `espace-parent/[studentId]` (soumission) et la fiche élève staff (validation/refus)
- [x] Module discipline : sanctions/retenues liées à un élève, visibles dans le carnet — table `disciplinary_records` (`supabase/migrations/0016_discipline.sql`), gestion sur la fiche élève staff, lecture seule sur les portails parent/élève
- [x] Alertes seuils d'absentéisme — colonne `schools.absence_alert_threshold` configurable (`supabase/migrations/0017_absence_alert_threshold.sql`, réglable dans Paramètres, défaut 4/mois), détection de franchissement de seuil dans `absences/actions.ts` → email parent (`notifyAbsenceThreshold`) + entrée dans le journal d'audit

### P1 — Documents administratifs ✅ terminé
- [x] Génération PDF certificat de scolarité — `src/lib/pdf/certificate-document.tsx` (template réutilisable), route staff `dashboard/eleves/[id]/certificat/pdf` + libre-service parent `espace-parent/[studentId]/certificat`
- [x] Génération PDF attestation de réussite — route `dashboard/eleves/[id]/attestation/pdf` (même template, décision d'émission laissée au directeur — pas de calcul automatique de passage)
- [x] Génération convocation (réunion parents, conseil de discipline) — `src/lib/pdf/convocation-document.tsx`, formulaire + route `dashboard/eleves/[id]/convocation/pdf` (sujet, date, heure, lieu, message libre)

### P1 — Pilotage direction ✅ terminé
- [x] Tableau de bord : moyennes par classe/matière, taux de réussite, comparatif inter-classes — `dashboard/statistiques` (director-only), réutilise `computeClassBulletins` existant, comparatif visuel conforme à la skill dataviz (une seule teinte pour la magnitude, labels directs, couleurs de statut réservées)
- [x] Export statistiques — `dashboard/statistiques/export` (Excel : synthèse, comparatif classes, moyennes par matière), calcul factorisé dans `src/lib/statistics.ts` et partagé avec la page

### P2 — Qualité de vie
- [x] i18n : **chrome applicatif entièrement migré** — `src/lib/i18n/` (dictionnaire `locales/fr.ts` + `getDictionary()`, typé, sans routing par locale ni dépendance externe ajoutée : le changement de routing (`app/[locale]/...`) est un fort rayon d'action à ne faire que le jour où une 2e langue est réellement livrée). Détail dans `src/lib/i18n/README.md`.
  - [x] Scaffolding (`src/lib/i18n/index.ts`, `locales/fr.ts`, `README.md`)
  - [x] Sidebar, auth, tableau de bord, tout `src/app/dashboard/**` (élèves, classes, notes, absences, scolarité, services, emploi du temps, annonces, cahier de textes, statistiques, enseignants, journal, paramètres, salles)
  - [x] Tout `src/app/espace-parent/**` et `src/app/espace-eleve/**`
  - [x] `src/lib/timetable.ts` (`DAY_LABELS`)
  - [x] Routes d'export Excel (`statistiques/export`, `parametres/export`) et documents PDF (`src/lib/pdf/**`) — namespaces `excelExport` et `documents` dans `locales/fr.ts`, détail dans `src/lib/i18n/README.md`. Plus aucune chaîne française en dur dans le code applicatif.
- [x] Cahier de textes simplifié (leçon du jour + devoir à faire, visible par élève/parent) — table `lesson_logs` (`supabase/migrations/0018_lesson_logs.sql`, écriture restreinte comme les notes via `teacher_subjects`), page `dashboard/cahier-de-texte`, affiché en lecture seule sur les portails parent/élève

### P2 — Scale
- [x] Module cantine — [x] Module transport — livrés ensemble comme un seul module "services optionnels" (`supabase/migrations/0019_optional_services.sql`, tables `service_subscriptions`/`service_payments` avec discriminant `service_type`, plus correct que d'étendre `fee_structures` : contrairement à la scolarité, un élève y souscrit individuellement, pas toute la classe). Page `dashboard/services` (abonnement + paiement + reçu PDF), affiché en lecture seule dans `espace-parent/[studentId]`.
- [x] Gestion des salles comme ressource réservable — distinct du champ `room` (texte libre) déjà présent sur `timetable_slots` pour les cours récurrents : `supabase/migrations/0020_rooms.sql` (tables `rooms` + `room_bookings`, réservations ponctuelles avec détection de conflit), page `dashboard/salles`, usage interne au personnel uniquement (pas de portail parent/élève — non pertinent pour eux)
- [x] App mobile ou PWA installable — `src/app/manifest.ts`, icônes générées en code via `next/og` (`src/app/icon.tsx` 512×512, `src/app/apple-icon.tsx` 180×180, mêmes traits SVG que le logo GraduationCap déjà utilisé partout dans l'app) donc pas d'asset image à fournir. `public/sw.js` a évolué depuis (voir "Mode hors-ligne" ci-dessous) : réseau-d'abord avec secours cache pour les pages déjà visitées, plus le service worker no-op d'origine.

### P2 — Marketing & tarification ✅ terminé
- [x] Page d'accueil rafraîchie — `src/app/page.tsx` : section avantages passée de 4 à 8 points (ajout portail parent/élève, messagerie, emploi du temps/cahier de textes, documents PDF), retrait de la mention "universités" (hors périmètre) dans la section établissements. FAQ (`src/app/faq/page.tsx`) corrigée dans le même sens : la question "Edukoo fonctionne-t-il pour les universités ?" répondait auparavant "Oui" à tort — répond maintenant "Non" conformément à la décision de rester 100% secondaire.
- [x] Tarifs relevés après comparatif marché (Pronote/EcoleDirecte/Skolengo convertis en FCFA + alternative régionale sur-mesure) qui montrait Edukoo nettement sous-évalué : Starter 50 000 → 75 000 FCFA/an, School 120 000 → 200 000 FCFA/an, Premium 250 000 → 400 000 FCFA/an. Reste sous le plafond français converti et très en dessous du coût d'un logiciel sur-mesure régional. Appliqué dans `src/app/page.tsx`, `src/app/layout.tsx` (jsonLd), `src/app/faq/page.tsx`, `src/app/dashboard/upgrade/page.tsx`.
- [x] Blocage réel à l'expiration de l'essai gratuit — `schools.trial_ends_at` existait déjà en base (30 jours dès la création) mais rien ne bloquait l'accès une fois écoulé. `src/app/dashboard/layout.tsx` redirige maintenant un directeur dont l'essai a expiré vers `/dashboard/upgrade` (pathname transmis via un header `x-pathname` posé dans `src/proxy.ts`, pattern standard Next.js pour lire le chemin dans un Server Component sans boucle de redirection sur la page upgrade elle-même) ; un enseignant non-directeur voit un écran "Abonnement expiré" au lieu du dashboard. Même logique prévue pour un plan payant expiré (`plan_expires_at`), mais comme le passage à un plan payant reste 100% manuel (paiement Orange Money confirmé sur WhatsApp, `school.plan` modifié à la main dans Supabase), `plan_expires_at` n'est en pratique jamais renseigné aujourd'hui — donc aucun blocage réel pour les écoles déjà payantes tant que ce champ n'est pas explicitement rempli. Portails parent/élève non concernés (fonctions d'accès séparées dans `src/lib/portal.ts`).

### P2 — Onboarding ✅ terminé
- [x] Checklist de prise en main sur le dashboard directeur — `src/components/onboarding-checklist.tsx`, 7 étapes cochées automatiquement à partir des vraies données (année scolaire active en premier — sans elle, grille tarifaire/notes/emploi du temps ne fonctionnent pas), anneau de progression en %, repliable/fermable (état en localStorage).
- [x] Audit des impasses de navigation — 4 pages (notes, emploi du temps, services, statistiques) affichaient "Aucune année scolaire active. Configurez-la dans Paramètres." en texte brut non cliquable. Remplacé par `src/components/missing-prerequisite-notice.tsx` (lien direct, visible seulement pour le directeur — un enseignant ne peut pas configurer les paramètres de toute façon). Ajout d'ancres (`#annees-scolaires`, `#grille-tarifaire`, `#logo`) sur `dashboard/parametres` pour que les liens de la checklist et ces nouveaux boutons amènent directement sur le bon bloc plutôt qu'en haut d'une page à 6 sections.

### P2 — Confiance & résilience ✅ terminé
- [x] Pages Confidentialité et CGU — `src/app/confidentialite`, `src/app/cgu`, liées depuis le footer et la page d'inscription.
- [x] Libellé mobile money précisé sur l'accueil ("Suivi des paiements..." au lieu de "Paiements...") pour ne pas laisser croire à une passerelle de paiement intégrée.
- [x] Mode hors-ligne en lecture seule — `public/sw.js` passe d'un service worker no-op à une stratégie réseau-d'abord avec secours cache pour les pages HTML déjà visitées (GET, navigation uniquement — jamais les Server Actions). `src/components/offline-banner.tsx` affiche un bandeau quand `navigator.onLine` passe à `false`, prévenant que les données peuvent être périmées et qu'aucune action ne sera enregistrée. Volontairement pas de synchronisation d'écriture différée (trop risqué pour des notes/paiements : conflits, doublons silencieux).
- [x] Guide d'utilisation — `src/app/guide`, 18 sections couvrant toutes les fonctionnalités avec sommaire ancré, lié depuis le footer et la barre latérale du dashboard (nouvel onglet).
- [x] SMS de secours sur les absences — `src/lib/sms.ts` (Twilio par défaut, best-effort comme `email.ts`, silencieux tant que `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER` ne sont pas configurés). Câblé en complément de l'email sur `notifyAbsenceRecorded` et `notifyAbsenceThreshold` (les notifications les plus urgentes) — pas sur notes/paiements pour limiter le coût par SMS. Nécessite un compte Twilio actif pour fonctionner réellement ; non testé en envoi réel (pas d'accès à un compte).

### P3 — Personnel & Paie ✅ terminé
Décision du 2026-09-06 : module séparé de "Enseignants" (pas une extension), suite à discussion — la paie est un flux d'argent inverse de la scolarité (l'école verse, ne reçoit pas), et `teachers` ne couvre pas le personnel non-enseignant (comptable, gardien...).
- [x] Tables `staff_members` (référentiel personnel, lien optionnel vers `teachers` pour éviter de ressaisir nom/téléphone d'un enseignant déjà connu) et `payroll_payments` (historique des versements, reçu PDF) — `supabase/migrations/0024_payroll.sql`, RLS **restreinte au directeur y compris au niveau base** (`current_teacher_role() = 'director'` dans la policy, pas seulement `requireDirector()` côté appli) — seule table de l'appli avec cette restriction stricte, les montants de salaire étant plus sensibles qu'une donnée pédagogique partagée
- [x] Page `dashboard/personnel-paie` : liste du personnel actif, salaire mensuel, total versé, ajout (avec sélection d'un enseignant existant en option), désactivation
- [x] Paiement + reçu PDF (`personnel-paie/paiement`, `personnel-paie/recu/[id]`, `src/lib/pdf/payroll-receipt-document.tsx`) — même gabarit que les reçus scolarité/services
- [x] Nouvelle entrée de navigation "Personnel & Paie" (director only)
- Testé en navigateur de bout en bout sur données réelles : migration exécutée en production, ajout d'un membre du personnel de test, enregistrement d'un paiement (reçu `REC-2026-1029` généré), PDF vérifié (chargement sans erreur), puis paiement/membre/entrées de journal d'audit de test supprimés directement en base.

### Correction — navigation Notes/Bulletins ✅ terminé
Signalé par l'utilisateur le 2026-09-06 : le lien de menu "Notes & Bulletins" ne menait qu'à `dashboard/bulletins` (consultation/impression) — la page de saisie des notes (`dashboard/notes`) n'avait aucun lien de menu, seulement un raccourci sur l'accueil du tableau de bord et dans la checklist d'onboarding. Un enseignant cherchant "où saisir mes notes" cliquait sur le seul lien "Notes" visible et tombait sur une page de consultation vide.
- [x] Séparé en deux entrées de menu distinctes : "Notes" (`dashboard/notes`) et "Bulletins" (`dashboard/bulletins`) — `src/components/sidebar.tsx`, `src/lib/i18n/locales/fr.ts`. Vérifié en navigateur.

### Audit Notes/Bulletins/Classes — demandé par l'utilisateur le 2026-09-06 ("tout ce qui vaut la peine d'être fait vaut la peine d'être fait très bien")
Audit ciblé sur la profondeur réelle des fonctionnalités (pas juste "ça marche dans le cas nominal"), plus vérification de la cohérence entre Classes, Notes et Bulletins et de la fraîcheur du guide/site vitrine. Deux corrections appliquées et vérifiées en production, plusieurs trouvailles documentées sans correction (hors périmètre de cette passe).

**Corrigé :**
- [x] **Notes sans aucune limite de validité, à tous les niveaux** — trouvé en testant en direct : une valeur de 999 dans une note d'un élève réel faisait passer sa moyenne à 341,67/20 et la moyenne de classe à 45,97/20, sans erreur nulle part (le `max="20"` HTML était contournable, `saveGrades`/`importGradesFromExcel` ne vérifiaient que "est-ce un nombre", aucune contrainte en base). Corrigé : validation stricte tout-ou-rien dans `saveGrades` (rejette tout l'enregistrement avec le détail des notes fautives plutôt que de sauvegarder partiellement), même contrôle dans `importGradesFromExcel` (traité comme les valeurs déjà invalides, ignoré et compté), et contrainte `CHECK` en base (`supabase/migrations/0025_grade_score_bounds.sql`, vérifié avant écriture qu'aucune des 361 lignes existantes ne la viole). Re-testé après correctif : la même valeur 999 est maintenant rejetée avec un message clair, aucune donnée corrompue.
- [x] **Classes/Notes/Bulletins désynchronisés en cas de changement de classe d'un élève** — `grades.class_id` et `absences.class_id` sont recopiés à la saisie mais jamais mis à jour si l'élève change de classe ensuite ; `src/lib/bulletin.ts` (et donc Statistiques et Détection à risque, qui le réutilisent) filtrait les notes/absences par cette colonne, alors que la page Notes filtre par élève directement — un élève transféré aurait vu son bulletin afficher "aucune note" dans sa nouvelle classe alors que ses notes existaient bien. Corrigé : `bulletin.ts` et `dashboard/absences` (page + actions, y compris la détection de conflit hors-ligne) filtrent maintenant par la liste des élèves actuels de la classe plutôt que par cette colonne recopiée. **Testé en production** : élève réel déplacé temporairement de 3ème B vers 6ème A, bulletin vérifié correct dans les deux classes (12.60/20 conservé), puis remis dans sa vraie classe.
- [x] Formulation redondante dans le nouveau message d'erreur ("entre 0 et 20/20") corrigée avant même d'être vue par un utilisateur réel.

**Trouvé, pas corrigé dans cette passe (à traiter séparément) :**
- Il n'existe **aucune page pour modifier un élève après sa création** (nom, date de naissance, contact parent, classe...) — `updateStudent` existe dans `src/app/dashboard/eleves/actions.ts` mais n'est appelé par aucun composant, c'est du code mort. C'est ce qui a rendu le bug ci-dessus non déclenchable par un vrai utilisateur aujourd'hui — mais "modifier un élève" est un besoin évident et sa construction future aurait immédiatement révélé le problème sans la correction déjà posée.
- `dashboard/bulletins/page.tsx` et `appreciation-cell.tsx` n'ont jamais été migrés en i18n (chaînes françaises en dur), contrairement à ce qu'affirme `src/lib/i18n/README.md`.
- Accès incohérent : la saisie de notes est strictement limitée à la classe/matière assignée d'un enseignant (`teacher_subjects`), mais la page Bulletins est ouverte à tout enseignant pour n'importe quelle classe de l'école (classement complet, toutes matières).
- **Guide d'utilisation** (18 sections) : 4 fonctionnalités entières absentes (modèle scolaire cycle/niveau, détection à risque, synthèses IA, écriture hors-ligne+sync, Personnel & Paie), PWA et hors-ligne lecture seule jamais mentionnés, section Statistiques obsolète (ne mentionne pas "Élèves à surveiller"), titre de section "Notes et bulletins" pas encore adapté au nouveau découpage du menu.
- **Site vitrine** : la FAQ affirme avoir des clients en Côte d'Ivoire, au Sénégal et au Mali — rien dans le code ou l'historique ne corrobore cette affirmation (le passage en payant reste entièrement manuel). Affirmation de support "généralement dans l'heure" également invérifiable. La liste d'avantages sur l'accueil (8 points, révision P2 de début septembre) ne reflète aucun des chantiers P3 (hors-ligne, IA, détection à risque, Personnel & Paie, cycle/niveau). Tarifs par contre cohérents entre accueil et FAQ.

### ⚪ Hors périmètre (décidé)
Décision prise le 2026-09-03 : Edukoo reste 100% secondaire (collège/lycée). Le volet universitaire (ECTS, UE, jurys, inscription à la carte) est **écarté de la feuille de route** — pas de tâches à prévoir dessus. Le tableau comparatif universitaire plus haut est conservé uniquement comme référence historique de l'analyse.

---

## P3 — Différenciation stratégique (suite à l'appréciation critique du 2026-09-06)

*Contexte : une analyse externe (« ANALYSE CRITIQUE DE EDUKOO.docx ») a évalué l'appli sur un sous-ensemble d'écrans (année scolaire, classes, matières, coefficients, notes, élèves, paiements, enseignants) et a donc jugé « absents » des modules en réalité déjà livrés (portail parent/élève, emploi du temps, messagerie, cahier de texte, discipline, documents PDF, statistiques, services, salles, PWA — voir P0-P2 ci-dessus, tous ✅). Sur ce point précis l'analyse est obsolète, pas le produit.*

*En revanche, sa thèse centrale résiste à la vérification du code : aucune des fonctions livrées (portail parent, EDT, messagerie, discipline...) n'est différenciante en soi — ce sont des standards désormais couverts par Pronote/EcoleDirecte/Skolengo aussi (cf. tableau comparatif en haut de ce fichier). Trois angles morts réels, vérifiés dans le code au 2026-09-06, restent ouverts :*
- *Aucune modélisation cycle/niveau/série-filière : `classes` est une table plate (nom libre), sans hiérarchie post-primaire/secondaire général/technique ni séries (A, C, D...) du système burkinabè.*
- *Zéro code lié à l'IA ou à la détection précoce : aucune dépendance, aucun module d'alerte au-delà du seuil d'absentéisme déjà existant (P1).*
- *`dashboard/statistiques` (`src/lib/statistics.ts`) ne calcule que des moyennes/taux de réussite agrégés par classe/matière — rétrospectif, pas de signal par élève.*

### P3 — Modèle scolaire burkinabè (fondation des deux points suivants)
- [x] Modéliser cycle → niveau comme référentiel par école — tables `education_cycles`/`education_levels` (`supabase/migrations/0022_education_levels.sql`), seed par défaut (post-primaire 6e→3e, secondaire général 2nde→Tle avec séries A/C/D ; cycle technique/pro laissé vide, trop spécifique à chaque lycée pour un défaut national) posé sur les écoles existantes et sur toute nouvelle inscription (`handle_new_school_signup()`). `classes.education_level_id` remplace le texte libre `classes.level` pour les nouvelles classes ; `level` conservé en repli d'affichage pour les classes déjà créées non rattachées (backfill best-effort par correspondance exacte de texte inclus dans la migration). Migration exécutée en production le 2026-09-06 et vérifiée dans le navigateur (seed des cycles/niveaux visible, rattachement d'une classe existante testé et persistant après rechargement).
- [x] Gestion des cycles/niveaux par le directeur (ajout libre, suppression si non utilisé) et rattachement classe→niveau (création et classes existantes) — `dashboard/classes` (`class-forms.tsx`, `actions.ts` : `createEducationCycle`, `createEducationLevel`, `deleteEducationLevel`, `assignClassLevel`)
- [ ] Étendre l'affichage/filtrage par cycle et niveau aux bulletins et à `dashboard/statistiques` (aujourd'hui : uniquement sur `dashboard/classes` et l'export Excel global) — reste à faire, pas fait dans cette passe pour rester une tâche de taille session
- [ ] Bulletins conformes aux mentions officielles par niveau si elles diffèrent (ex. mentions post-primaire vs lycée)

### P3 — Détection précoce des élèves à risque
- [x] Définir les signaux disponibles sans IA externe et un score simple par élève — `src/lib/at-risk.ts` (`computeAtRiskStudents`) : chute de moyenne ≥2pts d'une période à l'autre, moyenne <8/20, absences non justifiées ≥ seuil déjà configuré par l'école (`schools.absence_alert_threshold`, réutilisé sur la période plutôt que le mois calendaire), sanction disciplinaire sur la période. Score = nombre de facteurs déclenchés, pas de pondération — volontairement explicable de tête, pas un modèle à ajuster. Vérifié en navigateur (aucun signal sur les données de démo actuelles, cohérent avec des moyennes à 13+/20 et 100% de réussite).
- [x] Vue « élèves à surveiller » dans `dashboard/statistiques` (director) et sur la fiche élève staff, avec le ou les facteurs qui expliquent le signalement — table triée par score sur `dashboard/statistiques`, encart rouge sur `dashboard/eleves/[id]` (calculé sur le dernier trimestre où l'élève a des notes, limité à sa classe)
- [ ] Notification au directeur (email, comme les autres notifications déjà câblées) quand un élève franchit le seuil — pas fait dans cette passe : nécessite de détecter le "franchissement" (avant/après) au moment de la saisie d'une note/absence/sanction, plus gros morceau que le reste de ce chantier, à traiter séparément

### P3 — IA orientée décision (au-dessus du score ci-dessus, pas un chatbot)
- [x] Synthèse en langage naturel d'un bulletin de classe ou d'école — `src/lib/ai.ts` (`generateStatisticsSummary`, Claude Opus 5, effort bas, 3-5 phrases), bouton « Générer une synthèse (IA) » sur `dashboard/statistiques` (`actions.ts` + `summary-button.tsx`), génération strictement à la demande (clic), jamais en fond, pour maîtriser le coût
- [x] Explication du signalement « élève à risque » en une phrase — `generateAtRiskExplanation`, bouton « Expliquer avec l'IA » sur le panneau à risque de la fiche élève (`src/app/dashboard/eleves/at-risk-actions.ts` + `at-risk-panel.tsx`)
- Gestion d'erreur typée (clé invalide / quota / erreur API) traduite en message directeur au lieu de faire planter la page — vérifié en navigateur avec une vraie clé invalide puis une clé valide sans crédit (erreurs correctement affichées dans les deux cas). **Nécessite un compte Anthropic avec du crédit pour fonctionner réellement** (`ANTHROPIC_API_KEY` dans `.env.local`) — clé en place au 2026-09-06 mais solde de crédit à zéro, donc pas encore testé avec une vraie génération de texte.
- [x] Limite d'usage quotidienne par plan (trou identifié lors de l'appréciation critique du 2026-09-06 : rien n'empêchait un clic répété de consommer l'API sans limite) — table `ai_usage` + fonction `consume_ai_quota()` (`supabase/migrations/0023_ai_usage_quota.sql`, incrémentation et vérification de seuil atomiques), limites par plan dans `src/lib/ai-quota.ts` (trial 3/j, starter 5/j, school 15/j, premium 30/j), vérifiée avant l'appel Claude dans `generateSummary` et `explainAtRisk`. Migration exécutée en production et fonction testée directement (3 appels avec une limite de test à 2 : autorisé, autorisé, bloqué) puis ligne de test supprimée.

### P3 — Connectivité faible : écrire hors-ligne, pas seulement lire ✅ terminé
Décision du 2026-09-06 confirmée avec l'utilisateur avant implémentation : périmètre limité à **notes et absences uniquement** (paiements exclus — risque de double encaissement trop élevé pour une synchronisation automatique) ; stratégie de conflit **dernier arrivé gagne + entrée dans le journal d'audit** (pas de blocage manuel). Ceci renverse partiellement la décision documentée dans `public/sw.js` ("volontairement pas de sync") — le commentaire du fichier a été mis à jour pour refléter le nouveau périmètre exact (notes/absences oui, paiements et tout le reste non, inchangé).
- [x] File d'attente locale (`src/lib/offline-queue.ts`, localStorage) : `GradesForm`/`AbsencesForm` tentent l'enregistrement en ligne d'abord (peu importe `navigator.onLine`, souvent faux positif) et ne mettent en attente qu'en cas d'échec réel de la requête — snapshot des valeurs affichées inclus pour la détection de conflit
- [x] Indicateur "en attente de synchronisation" — message ambre inline sur le formulaire au moment de la mise en attente, + bandeau global (`src/components/offline-sync.tsx`, monté dans `dashboard/layout.tsx`) affichant le nombre en attente et le résultat de la dernière synchronisation
- [x] Rejeu à la reconnexion — écoute l'événement `online` + tentative au montage si déjà en ligne, un élément à la fois dans l'ordre, s'arrête proprement si le réseau retombe en cours de route (retente à la prochaine reconnexion plutôt que de sauter des éléments)
- [x] Détection de conflit — au moment du rejeu, `saveGrades`/`saveAbsences` comparent la valeur serveur actuelle au snapshot pris au moment de la saisie hors-ligne ; en cas d'écart, entrée `logAction` ("Conflit de synchronisation hors-ligne") avant l'écrasement (dernier arrivé gagne)
- Testé en navigateur de bout en bout sur données réelles : requête interceptée pour simuler une coupure réseau → saisie mise en file (message ambre confirmé) → requête restaurée → rechargement → synchronisation automatique confirmée (valeur bien écrite en base, file vidée) → conflit simulé (snapshot volontairement erroné) → entrée correctement tracée dans `dashboard/journal`. Un bug de traitement en double a été détecté pendant ce test (double-invocation des effets React en développement faisant tourner deux boucles de synchronisation concurrentes sur le même élément) et corrigé par un verrou au niveau du module (`syncInFlight`) plutôt qu'un state de composant, pour survivre aussi à un remontage rapide du composant. Valeur de test restaurée après coup ; les 4 entrées de test ("Conflit de synchronisation hors-ligne", 06/09/2026) ont été supprimées directement en base (pas de fonction de suppression dans l'appli — requête ciblée sur `action=eq.Conflit de synchronisation hors-ligne`, seules entrées existantes avec cette valeur, confirmées une à une avant suppression).

*Ces quatre chantiers correspondent au test stratégique proposé par l'analyse externe (« Contrairement aux autres logiciels de gestion scolaire, Edukoo permet de… ») : ce sont les seuls points du rapport qui, une fois vérifiés dans le code, désignent un vrai vide plutôt qu'une fonctionnalité déjà livrée.*
