import fr from './locales/fr'

/**
 * Locales disponibles. 'fr' est la seule active aujourd'hui — Edukoo
 * cible le marché scolaire francophone. Pour ajouter 'en' (ou une autre
 * locale) plus tard : créer locales/en.ts avec la même forme que
 * locales/fr.ts, l'ajouter à `dictionaries` et à `locales` ci-dessous,
 * puis brancher un mécanisme de détection/sélection de locale (cookie ou
 * segment d'URL) dans getDictionary(). Aucun changement structurel
 * n'est requis dans les pages : elles appellent déjà getDictionary().
 */
export const locales = ['fr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

const dictionaries = { fr } as const

export type Dictionary = (typeof dictionaries)[Locale]

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale]
}
