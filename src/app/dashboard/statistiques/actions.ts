'use server'

import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { computeSchoolStatistics } from '@/lib/statistics'
import { generateStatisticsSummary } from '@/lib/ai'
import { consumeAiQuota } from '@/lib/ai-quota'
import { getDictionary } from '@/lib/i18n'

export async function generateSummary(trimester: number) {
  const { school, schoolYear } = await requireDirector()
  if (!schoolYear) return { error: getDictionary().errors.noActiveSchoolYearSettings }

  const supabase = await createClient()
  const quota = await consumeAiQuota(supabase, school.id, school.plan)
  if (!quota.ok) return { error: quota.error }

  const { schoolAverage, schoolSuccessRate, classStats, subjectStats } = await computeSchoolStatistics({
    schoolId: school.id,
    schoolYearId: schoolYear.id,
    trimester,
  })

  const result = await generateStatisticsSummary({
    schoolAverage,
    schoolSuccessRate,
    classStats: classStats.map((c) => ({ className: c.className, average: c.average, successRate: c.successRate })),
    subjectStats: subjectStats.map((s) => ({ subjectName: s.subjectName, average: s.average })),
  })

  if ('error' in result) return { error: result.error }
  return { summary: result.text }
}
