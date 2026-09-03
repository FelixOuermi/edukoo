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

**Tout le chrome applicatif est désormais migré** (tout `src/app/dashboard/**`, les deux portails, la lib partagée `timetable.ts`), à l'exception des routes d'export/PDF ci-dessous.

## Reste à faire

Seules les routes d'export (`statistiques/export/route.ts`, `parametres/export/route.ts`) et les documents PDF (`src/lib/pdf/**`) contiennent encore des chaînes françaises — volontairement pas touchées. Ce sont des en-têtes de colonnes Excel et du contenu de document (pas du chrome d'appli), une catégorie à part qui mérite sa propre passe dédiée plutôt que d'être migrée à moitié en passant sur une seule page. Tout le reste de l'application passe par `getDictionary()`.

Note : `src/lib/timetable.ts` (`DAY_LABELS`) contient aussi des noms de jours en dur, partagés par `dashboard/emploi-du-temps`, `espace-parent` et `espace-eleve` — volontairement pas encore migré (fichier partagé, à traiter avec précaution plutôt qu'en passant vite sur une seule page).

Note pour la suite : `locales/fr.ts` a maintenant un namespace `paymentMethods` (cash/orange_money/moov_money/transfer) réutilisable partout où un `paymentMethodLabel` local existe encore en dur (scolarité, services, reçus PDF) — remplacer ces objets locaux par `getDictionary().paymentMethods` au lieu de les dupliquer à nouveau.

Pour continuer, migrer page par page en suivant le même schéma que dans `auth/login/page.tsx` :

1. Ajouter les clés manquantes dans `locales/fr.ts` (respecter le regroupement par domaine : `nav`, `auth`, puis un nouveau bloc par section — `students`, `grades`, `absences`...).
2. Remplacer les chaînes en dur par `t.section.cle`.
3. Vérifier `npx tsc --noEmit` (les clés manquantes cassent la compilation grâce au typage strict — c'est voulu, ça empêche d'oublier une traduction).

Ne pas migrer plusieurs sections indépendantes dans un même passage sans repasser par `next build` entre deux — c'est une longue série de petits changements mécaniques, pas un refactor architectural, donc autant les vérifier au fur et à mesure plutôt qu'en bloc.
