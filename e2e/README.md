# Tests end-to-end (Playwright)

Ces tests pilotent un vrai navigateur pour vérifier le parcours connecté
(connexion, tableau de bord, création de classe, inscription d'élève...).
Claude ne peut pas les lancer lui-même — l'authentification (saisir un
identifiant/mot de passe) est une action qu'il refuse de faire, même avec des
identifiants fournis explicitement. C'est à toi de les exécuter.

## ⚠️ Utilise un compte de TEST, jamais un compte de production

Ces tests créent de vraies données (classe, élève) dans l'école du compte
utilisé, préfixées `E2E Test`/`E2E-` pour rester repérables. Il n'existe pas
de bouton "supprimer une classe" dans l'app (volontaire : une école ne doit
pas pouvoir perdre des données par erreur), donc ces données de test
**persistent** après chaque exécution.

→ Crée une école dédiée aux tests via `/auth/register` (ex : "École Test
E2E") et utilise uniquement ce compte-là pour `E2E_DIRECTOR_EMAIL` /
`E2E_DIRECTOR_PASSWORD`. Ne pointe jamais ces tests vers l'école réelle
d'un client, ni vers ton propre compte de production.

## Configuration

1. Installe les navigateurs Playwright (une seule fois) :
   ```
   npx playwright install chromium
   ```
2. Ajoute ces variables à `.env.local` (déjà ignoré par git) :
   ```
   E2E_DIRECTOR_EMAIL=directeur@ecole-test.com
   E2E_DIRECTOR_PASSWORD=le-mot-de-passe-du-compte-de-test
   ```
   (le compte doit déjà exister — inscris-le une fois via `/auth/register`)

## Lancer les tests

Contre le serveur de dev local (démarre `npm run dev` dans un autre terminal
avant) :
```
npm run test:e2e
```

Contre la production (edukoo.vercel.app) :
```
PLAYWRIGHT_BASE_URL=https://edukoo.vercel.app npm run test:e2e
```

Mode debug/interactif (voir le navigateur, pas-à-pas) :
```
npm run test:e2e:ui
```

## Ce qui est couvert aujourd'hui

- `auth.setup.ts` — connexion, réutilisée par les autres tests (une seule
  connexion par exécution, pas une par test).
- `dashboard.spec.ts` — le tableau de bord se charge avec ses indicateurs ;
  la checklist de prise en main se replie/se ferme et le retient au
  rechargement.
- `classes-students.spec.ts` — création d'une classe, puis inscription d'un
  élève dans cette classe.

## Étendre la suite

Même schéma pour toute nouvelle fonctionnalité : un fichier `*.spec.ts` dans
`e2e/`, `page.goto(...)`, sélectionner les champs par `name`/`role`/texte
visible (pas par position CSS), et vérifier avec `expect(...).toBeVisible()`.
Le projet `chromium` réutilise automatiquement la session de `auth.setup.ts`
(pas besoin de se reconnecter dans chaque fichier).
