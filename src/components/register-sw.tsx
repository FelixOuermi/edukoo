'use client'

import { useEffect } from 'react'

/**
 * Enregistre le service worker (voir public/sw.js — cache réseau-d'abord
 * des pages déjà visitées pour un secours hors-ligne en lecture seule).
 * Rendu côté client uniquement : ne doit jamais bloquer ni ralentir le
 * rendu serveur.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}
