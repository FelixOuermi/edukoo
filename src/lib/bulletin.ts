import { createClient } from '@/lib/supabase/server'

export interface SubjectGrade {
  subjectName: string
  coefficient: number
  score: number | null
  weighted: number | null
}

export interface StudentBulletin {
  studentId: string
  studentName: string
  className: string
  subjects: SubjectGrade[]
  average: number | null
  rank: number | null
  mention: string
}

export function mentionFor(average: number | null) {
  if (average === null) return '—'
  if (average >= 16) return 'Excellent'
  if (average >= 14) return 'Très Bien'
  if (average >= 12) return 'Bien'
  if (average >= 10) return 'Assez Bien'
  return 'Insuffisant'
}

export async function computeClassBulletins({
  schoolId,
  classId,
  schoolYearId,
  trimester,
}: {
  schoolId: string
  classId: string
  schoolYearId: string
  trimester: number
}): Promise<{ className: string; bulletins: StudentBulletin[] }> {
  const supabase = await createClient()

  const { data: klass } = await supabase
    .from('classes')
    .select('name')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!klass) return { className: '—', bulletins: [] }

  const [{ data: students }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('class_id', classId)
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .order('last_name'),
    supabase.from('subjects').select('id, name, coefficient').eq('school_id', schoolId).order('name'),
    supabase
      .from('grades')
      .select('student_id, subject_id, score')
      .eq('class_id', classId)
      .eq('school_year_id', schoolYearId)
      .eq('trimester', trimester),
  ])

  const className = klass.name
  const gradeMap = new Map<string, number>()
  for (const g of grades ?? []) {
    gradeMap.set(`${g.student_id}:${g.subject_id}`, Number(g.score))
  }

  const bulletins: StudentBulletin[] = (students ?? []).map((s) => {
    const subjectGrades: SubjectGrade[] = (subjects ?? []).map((subj) => {
      const score = gradeMap.get(`${s.id}:${subj.id}`) ?? null
      return {
        subjectName: subj.name,
        coefficient: subj.coefficient,
        score,
        weighted: score !== null ? score * subj.coefficient : null,
      }
    })

    const graded = subjectGrades.filter((sg) => sg.score !== null)
    const totalCoef = graded.reduce((sum, sg) => sum + sg.coefficient, 0)
    const totalWeighted = graded.reduce((sum, sg) => sum + (sg.weighted ?? 0), 0)
    const average = totalCoef > 0 ? totalWeighted / totalCoef : null

    return {
      studentId: s.id,
      studentName: `${s.first_name} ${s.last_name}`,
      className,
      subjects: subjectGrades,
      average,
      rank: null,
      mention: mentionFor(average),
    }
  })

  const ranked = [...bulletins]
    .filter((b) => b.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))

  ranked.forEach((b, i) => {
    const target = bulletins.find((x) => x.studentId === b.studentId)
    if (target) target.rank = i + 1
  })

  return { className, bulletins }
}
