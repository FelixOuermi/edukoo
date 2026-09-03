// Service worker minimal : ne met rien en cache. Les données de l'école
// (notes, absences, paiements...) changent en continu — un cache agressif
// servirait des données périmées, ce qui serait activement dangereux pour
// une appli de gestion scolaire. Ce service worker sert uniquement à
// satisfaire les critères d'installabilité PWA de certains navigateurs.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Ne rien faire : laisse le navigateur traiter la requête normalement.
})
