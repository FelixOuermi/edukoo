import { createClient } from '@/lib/supabase/server'
import { computeClassBulletins } from '@/lib/bulletin'

export interface ClassStat {
  classId: string
  className: string
  average: number | null
  successRate: number | null
  studentCount: number
  gradedCount: number
}

export interface SubjectStat {
  subjectName: string
  average: number
  count: number
}

export async function computeSchoolStatistics({
  schoolId,
  schoolYearId,
  trimester,
}: {
  schoolId: string
  schoolYearId: string
  trimester: number
}): Promise<{ classStats: ClassStat[]; subjectStats: SubjectStat[]; schoolAverage: number | null; schoolSuccessRate: number | null }> {
  const supabase = await createClient()

  const { data: classes } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')

  const classResults = await Promise.all(
    (classes ?? []).map((c) =>
      computeClassBulletins({ schoolId, classId: c.id, schoolYearId, trimester }).then((r) => ({
        classId: c.id,
        className: c.name,
        bulletins: r.bulletins,
      }))
    )
  )

  const classStats: ClassStat[] = classResults
    .map((r) => {
      const graded = r.bulletins.filter((b) => b.average !== null)
      const average = graded.length > 0 ? graded.reduce((sum, b) => sum + (b.average ?? 0), 0) / graded.length : null
      const successCount = graded.filter((b) => (b.average ?? 0) >= 10).length
      const successRate = graded.length > 0 ? (successCount / graded.length) * 100 : null
      return {
        classId: r.classId,
        className: r.className,
        average,
        successRate,
        studentCount: r.bulletins.length,
        gradedCount: graded.length,
      }
    })
    .sort((a, b) => (b.average ?? -1) - (a.average ?? -1))

  const subjectScores = new Map<string, number[]>()
  for (const r of classResults) {
    for (const b of r.bulletins) {
      for (const sg of b.subjects) {
        if (sg.score === null) continue
        const list = subjectScores.get(sg.subjectName) ?? []
        list.push(sg.score)
        subjectScores.set(sg.subjectName, list)
      }
    }
  }
  const subjectStats: SubjectStat[] = Array.from(subjectScores.entries())
    .map(([subjectName, scores]) => ({
      subjectName,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      count: scores.length,
    }))
    .sort((a, b) => b.average - a.average)

  const allGraded = classStats.flatMap((c) => (c.average !== null ? [{ average: c.average, successRate: c.successRate ?? 0 }] : []))
  const schoolAverage = allGraded.length > 0 ? allGraded.reduce((sum, c) => sum + c.average, 0) / allGraded.length : null
  const schoolSuccessRate =
    allGraded.length > 0 ? allGraded.reduce((sum, c) => sum + c.successRate, 0) / allGraded.length : null

  return { classStats, subjectStats, schoolAverage, schoolSuccessRate }
}
