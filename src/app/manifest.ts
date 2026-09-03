import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Edukoo — Gestion scolaire',
    short_name: 'Edukoo',
    description:
      'Gérez votre école : élèves, notes, absences, scolarité et communication avec les parents.',
    start_url: '/auth/login',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    lang: 'fr',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
