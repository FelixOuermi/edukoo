import { getDictionary } from '@/lib/i18n'

export const DAY_LABELS: Record<number, string> = getDictionary().days

export const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6]

export function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd
}
