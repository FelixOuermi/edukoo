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
- [x] App mobile ou PWA installable — `src/app/manifest.ts`, icônes générées en code via `next/og` (`src/app/icon.tsx` 512×512, `src/app/apple-icon.tsx` 180×180, mêmes traits SVG que le logo GraduationCap déjà utilisé partout dans l'app) donc pas d'asset image à fournir, service worker minimal (`public/sw.js`) qui ne met **rien** en cache — juste pour l'installabilité, aucun risque de données scolaires périmées affichées hors-ligne

### P2 — Marketing & tarification ✅ terminé
- [x] Page d'accueil rafraîchie — `src/app/page.tsx` : section avantages passée de 4 à 8 points (ajout portail parent/élève, messagerie, emploi du temps/cahier de textes, documents PDF), retrait de la mention "universités" (hors périmètre) dans la section établissements. FAQ (`src/app/faq/page.tsx`) corrigée dans le même sens : la question "Edukoo fonctionne-t-il pour les universités ?" répondait auparavant "Oui" à tort — répond maintenant "Non" conformément à la décision de rester 100% secondaire.
- [x] Tarifs relevés après comparatif marché (Pronote/EcoleDirecte/Skolengo convertis en FCFA + alternative régionale sur-mesure) qui montrait Edukoo nettement sous-évalué : Starter 50 000 → 75 000 FCFA/an, School 120 000 → 200 000 FCFA/an, Premium 250 000 → 400 000 FCFA/an. Reste sous le plafond français converti et très en dessous du coût d'un logiciel sur-mesure régional. Appliqué dans `src/app/page.tsx`, `src/app/layout.tsx` (jsonLd), `src/app/faq/page.tsx`, `src/app/dashboard/upgrade/page.tsx`.
- Note : le bouton "Essai gratuit 30 jours" n'est pas backé par un mécanisme technique (pas de compte à rebours ni de blocage de fonctionnalités par plan dans le code, `school.plan` est mis à jour manuellement après confirmation WhatsApp/Orange Money) — pur texte marketing pour l'instant, à garder en tête si jamais scruté.

### ⚪ Hors périmètre (décidé)
Décision prise le 2026-09-03 : Edukoo reste 100% secondaire (collège/lycée). Le volet universitaire (ECTS, UE, jurys, inscription à la carte) est **écarté de la feuille de route** — pas de tâches à prévoir dessus. Le tableau comparatif universitaire plus haut est conservé uniquement comme référence historique de l'analyse.
