'use server'

import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { computeAtRiskStudents } from '@/lib/at-risk'
import { generateAtRiskExplanation } from '@/lib/ai'
import { consumeAiQuota } from '@/lib/ai-quota'
import { getDictionary } from '@/lib/i18n'

export async function explainAtRisk(studentId: string, classId: string, trimester: number) {
  const { school, schoolYear } = await requireDirector()
  if (!schoolYear) return { error: getDictionary().errors.noActiveSchoolYearSettings }

  const supabase = await createClient()
  const quota = await consumeAiQuota(supabase, school.id, school.plan)
  if (!quota.ok) return { error: quota.error }

  const students = await computeAtRiskStudents({
    schoolId: school.id,
    schoolYearId: schoolYear.id,
    trimester,
    absenceAlertThreshold: school.absence_alert_threshold,
    classId,
  })
  const student = students.find((s) => s.studentId === studentId)
  if (!student) return { error: getDictionary().errors.studentNotFound }

  const result = await generateAtRiskExplanation({
    studentName: student.studentName,
    average: student.average,
    previousAverage: student.previousAverage,
    unjustifiedAbsences: student.unjustifiedAbsences,
    disciplineCount: student.disciplineCount,
    factors: student.factors,
  })

  if ('error' in result) return { error: result.error }
  return { explanation: result.text }
}
