// Service worker : hors-ligne EN LECTURE SEULE uniquement.
//
// Ne met en cache que les pages HTML déjà visitées (requêtes GET de
// navigation), jamais les Server Actions (POST) ni les payloads de
// navigation client (RSC). En ligne : toujours la version fraîche du
// réseau (network-first), une copie est gardée au passage. Hors-ligne :
// on sert la dernière copie connue de CETTE page précise si elle existe,
// sinon la page d'erreur hors-ligne habituelle du navigateur.
//
// Pour les paiements et tout le reste : toujours PAS de mode "modifier
// hors-ligne + synchroniser au retour" — un doublon d'encaissement est un
// risque trop élevé pour une resynchronisation automatique. Le bandeau
// côté client (src/components/offline-banner.tsx) prévient l'utilisateur
// que les données affichées peuvent être périmées et qu'aucune action ne
// sera enregistrée tant que la connexion n'est pas rétablie.
//
// Exception : la saisie de notes et d'absences peut désormais être mise en
// attente hors-ligne puis synchronisée automatiquement au retour du réseau
// (src/lib/offline-queue.ts + src/components/offline-sync.tsx), avec
// détection de conflit (dernier arrivé gagne, tracé dans le journal
// d'audit) — ce mécanisme est côté client (localStorage), indépendant de
// ce service worker qui reste lecture seule.
const CACHE_NAME = 'edukoo-offline-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || request.mode !== 'navigate') return

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  )
})
