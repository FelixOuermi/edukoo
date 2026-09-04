# Scripts

## test-tenant-isolation.mjs — régression sur l'isolation multi-tenant

Ce script attaque directement la base (RLS + triggers) avec deux vraies
sessions authentifiées, exactement comme le ferait un attaquant appelant
l'API Supabase directement (hors app). Il rejoue les deux classes de faille
déjà corrigées deux fois dans ce projet :

- **isolation par école** (`supabase/migrations/0001_fix_tenant_isolation.sql`) :
  un directeur ne doit rien pouvoir lire/écrire d'une autre école ;
- **cohérence student_id/class_id** (`supabase/migrations/0021_fix_cross_tenant_isolation.sql`) :
  un directeur ne doit pas pouvoir insérer une ligne avec son propre
  `school_id` mais un `student_id`/`class_id` d'une autre école.

Il utilise la clé anonyme + une vraie connexion, jamais la service role key —
c'est la RLS elle-même qui est testée, pas contournée.

Claude ne peut pas le lancer lui-même — comme pour les tests Playwright
(voir `e2e/README.md`), l'authentification avec des identifiants est une
action qu'il refuse de faire. C'est à toi de l'exécuter.

## ⚠️ Deux écoles de TEST dédiées, jamais des écoles réelles

Le script crée des données de test (année scolaire, classe, matière, élève)
préfixées `E2E-Isolation` dans CHAQUE école utilisée. Comme il n'existe pas
de bouton de suppression dans l'app, ces données **persistent** après
chaque exécution.

→ Crée deux écoles dédiées via `/auth/register` (ex : "École Test
Isolation A" et "École Test Isolation B") et n'utilise que ces deux
comptes-là. Ne jamais pointer vers une école réelle ou ton compte de
production.

## Configuration

Ajoute ces variables à `.env.local` (déjà ignoré par git) :

```
E2E_SCHOOL_A_EMAIL=directeur-a@ecole-test-isolation.com
E2E_SCHOOL_A_PASSWORD=le-mot-de-passe-du-compte-a
E2E_SCHOOL_B_EMAIL=directeur-b@ecole-test-isolation.com
E2E_SCHOOL_B_PASSWORD=le-mot-de-passe-du-compte-b
```

(les deux comptes doivent déjà exister — inscris-les une fois via
`/auth/register`, un par école)

## Lancer

```
npm run test:isolation
```

Le script échoue (`exit 1`) et détaille quel FAIL a été observé si une
fuite cross-tenant est détectée. Sortie attendue si tout va bien :

```
10 succès, 0 échec(s).
```

## Étendre

Pour couvrir une nouvelle table sensible à l'isolation, ajoute un bloc
`report(...)` dans `test-tenant-isolation.mjs` suivant le même schéma :
tenter l'opération interdite depuis le client de l'école A visant une
ressource de l'école B, puis vérifier qu'elle est bien rejetée/filtrée.
