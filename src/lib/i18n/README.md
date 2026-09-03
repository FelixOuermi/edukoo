# i18n — état et méthode

## Ce qui existe

- `locales/fr.ts` : dictionnaire français, seule locale active.
- `index.ts` : `getDictionary(locale?)` — retourne le dictionnaire complet, typé (autocomplétion sur toutes les clés).

Aucune dépendance externe, aucun changement de routing (pas de `/fr/...` ni `/en/...`, pas de middleware). C'est volontaire : le produit ne sert qu'une locale aujourd'hui, et une restructuration de routing (`app/[locale]/...`, déplacement de **toutes** les routes) est un changement à fort rayon d'action qui ne se justifie que le jour où une deuxième langue est réellement livrée. Cette base sépare déjà "où vivent les chaînes" de "comment on choisit la langue", donc ce jour-là il n'y aura qu'à :

1. Créer `locales/en.ts` avec exactement la même forme que `locales/fr.ts`.
2. L'ajouter à `dictionaries` et `locales` dans `index.ts`.
3. Brancher une détection de locale (cookie, préférence utilisateur, ou segment d'URL) qui appelle `getDictionary(locale)`.

## Comment l'utiliser dans une page/composant

```tsx
import { getDictionary } from '@/lib/i18n'

export default function MaPage() {
  const t = getDictionary()
  return <h1>{t.nav.dashboard}</h1>
}
```

Fonctionne aussi bien dans un composant serveur que client (c'est un objet synchrone, pas un appel async).

## Migré

- `src/components/sidebar.tsx` (labels de navigation, déconnexion, plan payant)
- `src/app/auth/login/page.tsx`
- `src/app/auth/register/page.tsx`
- `src/app/auth/actions.ts` (message d'erreur "compte sans école")
- `src/app/dashboard/page.tsx` (tableau de bord, vues directeur et enseignant)
- `src/app/dashboard/eleves/page.tsx` (liste des élèves, filtres, tableau)
- `src/app/dashboard/eleves/nouveau/page.tsx` + `new-student-form.tsx` (inscription)
- `src/app/dashboard/eleves/[id]/page.tsx` (fiche élève complète) + tous ses composants co-localisés : `parent-section.tsx`, `discipline-section.tsx`, `message-thread.tsx`, `absence-row.tsx`, et les messages d'erreur de `parent-actions.ts`, `discipline-actions.ts`, `message-actions.ts`
- `src/app/dashboard/classes/**` (page, `class-forms.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/notes/**` (page, `grades-form.tsx`, `import-grades-button.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/absences/**` (page, `absences-form.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/scolarite/**` (page, `paiement/page.tsx` + `payment-form.tsx`, `recu/[id]/page.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/services/**` (page, `subscription-form.tsx`, `payment-form.tsx`, `paiement/page.tsx`, `recu/[id]/page.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/emploi-du-temps/**` (page, `timetable-form.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/annonces/**` (page, `announcement-form.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/cahier-de-texte/**` (page, `lesson-form.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/statistiques/page.tsx` (**pas** `export/route.ts` — voir note ci-dessous)
- `src/app/dashboard/enseignants/**` (page, `teacher-list.tsx`, `assignment-form.tsx`, messages d'erreur de `actions.ts`)
- `src/app/dashboard/journal/page.tsx`
- `src/app/dashboard/parametres/**` (page, `settings-forms.tsx`, messages d'erreur de `actions.ts` — **pas** `export/route.ts`, même note ci-dessous)
- `src/app/dashboard/salles/**` (page, `room-form.tsx`, messages d'erreur de `actions.ts`)
- Tout `src/app/espace-parent/**` (layout, page d'accueil, `[studentId]/page.tsx`, `message-thread.tsx`, `absence-row.tsx`, messages d'erreur de `message-actions.ts`/`absence-actions.ts`)
- Tout `src/app/espace-eleve/**` (layout, page)
- `src/lib/timetable.ts` (`DAY_LABELS` vient maintenant de `getDictionary().days` — `SCHOOL_DAYS` et `timesOverlap` inchangés, l'API publique du module n'a pas bougé)
- `src/lib/pdf/**` (`receipt-document.tsx`, `service-receipt-document.tsx`, `bulletin-document.tsx`, `certificate-document.tsx`, `convocation-document.tsx`) — namespace `documents` (`documents.common` pour les fragments partagés signature/pied de page entre certificat et convocation, `documents.receipt`/`serviceReceipt`/`bulletin`/`certificate`/`convocation` pour le reste)
- `src/app/dashboard/statistiques/export/route.ts` et `src/app/dashboard/parametres/export/route.ts` — namespace `excelExport` (`excelExport.statistics` et `excelExport.fullExport`), en-têtes de colonnes utilisés comme clés d'objet (`{ [t.classHeader]: ... }`) pour que `XLSX.utils.json_to_sheet` continue de les prendre comme en-têtes
- Les 3 routes appelantes de `CertificateDocument`/`ConvocationDocument` (`dashboard/eleves/[id]/certificat/pdf`, `dashboard/eleves/[id]/attestation/pdf`, `dashboard/eleves/[id]/convocation/pdf`, `espace-parent/[studentId]/certificat`) qui construisaient le texte du corps du document — utilisent maintenant `documents.certificate`/`documents.convocation` avec des templates `{placeholder}` remplacés séquentiellement, même convention que le reste du dictionnaire

**Tout le chrome applicatif et tous les documents générés (PDF + Excel) sont désormais migrés.** Il ne reste plus de chaîne française en dur dans `src/app/**` ni `src/lib/pdf/**`.

## Reste à faire

Rien d'identifié pour l'instant — toute l'application (chrome + documents PDF/Excel) passe par `getDictionary()`. Le seul travail restant pour une 2ᵉ langue est celui déjà documenté plus haut : créer `locales/en.ts` avec la même forme que `locales/fr.ts`, l'enregistrer dans `index.ts`, puis brancher une détection de locale.

Note pour la suite : `locales/fr.ts` a un namespace `paymentMethods` (cash/orange_money/moov_money/transfer) réutilisable partout où un `paymentMethodLabel` local existe encore en dur — déjà appliqué aux deux documents de reçu PDF.

Pour continuer, migrer page par page en suivant le même schéma que dans `auth/login/page.tsx` :

1. Ajouter les clés manquantes dans `locales/fr.ts` (respecter le regroupement par domaine : `nav`, `auth`, puis un nouveau bloc par section — `students`, `grades`, `absences`...).
2. Remplacer les chaînes en dur par `t.section.cle`.
3. Vérifier `npx tsc --noEmit` (les clés manquantes cassent la compilation grâce au typage strict — c'est voulu, ça empêche d'oublier une traduction).

Ne pas migrer plusieurs sections indépendantes dans un même passage sans repasser par `next build` entre deux — c'est une longue série de petits changements mécaniques, pas un refactor architectural, donc autant les vérifier au fur et à mesure plutôt qu'en bloc.
