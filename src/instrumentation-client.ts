import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Sans NEXT_PUBLIC_SENTRY_DSN, le SDK reste inerte (aucun envoi, aucune
  // erreur) : créer un projet Sentry (gratuit) et définir cette variable
  // (Vercel + .env.local) pour l'activer.
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
