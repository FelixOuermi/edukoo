// Service worker : hors-ligne EN LECTURE SEULE uniquement.
//
// Ne met en cache que les pages HTML déjà visitées (requêtes GET de
// navigation), jamais les Server Actions (POST) ni les payloads de
// navigation client (RSC). En ligne : toujours la version fraîche du
// réseau (network-first), une copie est gardée au passage. Hors-ligne :
// on sert la dernière copie connue de CETTE page précise si elle existe,
// sinon la page d'erreur hors-ligne habituelle du navigateur.
//
// Volontairement PAS de mode "modifier hors-ligne + synchroniser au
// retour" : pour des notes, absences ou paiements, une resynchronisation
// mal gérée peut créer des conflits ou des doublons silencieux — plus
// dangereux que pas de hors-ligne du tout. Le bandeau côté client
// (src/components/offline-banner.tsx) prévient l'utilisateur que les
// données affichées peuvent être périmées et qu'aucune action ne sera
// enregistrée tant que la connexion n'est pas rétablie.
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
