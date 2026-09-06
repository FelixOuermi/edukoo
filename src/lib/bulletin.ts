import { createClient } from '@/lib/supabase/server'

export interface SubjectGrade {
  subjectName: string
  coefficient: number
  score: number | null
  weighted: number | null
  // Moyenne de la matière sur toute la classe (moyenne simple des notes des
  // élèves ayant une note dans cette matière, même méthode que
  // src/lib/statistics.ts) — permet à l'élève de situer sa note par rapport
  // au reste de la classe directement sur son bulletin.
  classAverage: number | null
  appreciation: string | null
}

export interface StudentBulletin {
  studentId: string
  studentName: string
  className: string
  subjects: SubjectGrade[]
  average: number | null
  rank: number | null
  // Nombre d'élèves classés (moyenne non nulle) sur lesquels `rank` porte —
  // un rang seul ("8e") est peu lisible sans savoir sur combien d'élèves ;
  // exclut volontairement les élèves sans moyenne, comme le classement.
  rankedOutOf: number
  mention: string
  appreciation: string | null
  absencesJustified: number
  absencesUnjustified: number
  absencesScope: 'period' | 'year'
  // Décision du conseil de classe : annuelle (par année scolaire, pas par
  // trimestre) — voir class_council_decisions. null tant qu'elle n'a pas
  // encore été prise.
  councilDecision: 'passage' | 'redoublement' | 'passage_conditionnel' | null
  councilComment: string | null
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
  supabase: providedClient,
}: {
  schoolId: string
  classId: string
  schoolYearId: string
  trimester: number
  // Un parent/élève n'a par RLS accès qu'à son propre enfant, jamais au
  // reste de la classe : pour calculer un rang correct sur la classe
  // entière depuis leur portail, l'appelant doit fournir un client admin
  // (service role) ici. Par défaut, client lié à la session courante.
  supabase?: Awaited<ReturnType<typeof createClient>>
}): Promise<{ className: string; bulletins: StudentBulletin[] }> {
  const supabase = providedClient ?? (await createClient())

  const { data: klass } = await supabase
    .from('classes')
    .select('name')
    .eq('id', classId)
    .eq('school_id', schoolId)
    .maybeSingle()

  if (!klass) return { className: '—', bulletins: [] }

  const { data: schoolYear } = await supabase
    .from('school_years')
    .select('start_date, end_date')
    .eq('id', schoolYearId)
    .eq('school_id', schoolId)
    .maybeSingle()

  const { data: period } = await supabase
    .from('periods')
    .select('start_date, end_date')
    .eq('school_id', schoolId)
    .eq('school_year_id', schoolYearId)
    .eq('number', trimester)
    .maybeSingle()

  const absencesRange = period ?? schoolYear
  const absencesScope: 'period' | 'year' = period ? 'period' : 'year'

  // La liste d'élèves fait autorité sur "qui est dans cette classe" —
  // récupérée d'abord, puis utilisée pour filtrer notes/absences par
  // student_id plutôt que par leur propre colonne class_id. Cette colonne
  // est recopiée au moment de la saisie mais jamais mise à jour si
  // l'élève change de classe ensuite (dashboard/eleves/actions.ts
  // updateStudent modifie students.class_id, pas les lignes grades/
  // absences déjà existantes) : filtrer par elle ferait disparaître du
  // bulletin les notes/absences d'un élève transféré en cours d'année,
  // alors que la page Notes (qui ne filtre que par student_id) les
  // afficherait normalement — bulletin et notes désynchronisés.
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('class_id', classId)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .order('last_name')

  const studentIds = (students ?? []).map((s) => s.id)

  const [
    { data: subjects },
    { data: classCoefficients },
    { data: gradeTypes },
    { data: grades },
    { data: appreciations },
    { data: absences },
    { data: councilDecisions },
  ] = await Promise.all([
      supabase.from('subjects').select('id, name, coefficient').eq('school_id', schoolId).order('name'),
      supabase.from('class_subjects').select('subject_id, coefficient').eq('school_id', schoolId).eq('class_id', classId),
      supabase.from('grade_types').select('id, weight').eq('school_id', schoolId),
      studentIds.length > 0
        ? supabase
            .from('grades')
            .select('student_id, subject_id, grade_type_id, score')
            .in('student_id', studentIds)
            .eq('school_year_id', schoolYearId)
            .eq('trimester', trimester)
        : Promise.resolve({ data: [] as { student_id: string; subject_id: string; grade_type_id: string; score: number }[] }),
      supabase
        .from('bulletin_appreciations')
        .select('student_id, subject_id, appreciation')
        .eq('school_id', schoolId)
        .eq('school_year_id', schoolYearId)
        .eq('trimester', trimester),
      absencesRange && studentIds.length > 0
        ? supabase
            .from('absences')
            .select('student_id, is_justified')
            .in('student_id', studentIds)
            .eq('school_id', schoolId)
            .gte('absence_date', absencesRange.start_date)
            .lte('absence_date', absencesRange.end_date)
        : Promise.resolve({ data: [] as { student_id: string; is_justified: boolean }[] }),
      studentIds.length > 0
        ? supabase
            .from('class_council_decisions')
            .select('student_id, decision, comment')
            .in('student_id', studentIds)
            .eq('school_year_id', schoolYearId)
        : Promise.resolve({ data: [] as { student_id: string; decision: string | null; comment: string | null }[] }),
    ])

  const className = klass.name
  const weightByGradeType = new Map((gradeTypes ?? []).map((gt) => [gt.id, Number(gt.weight)]))
  const coefficientBySubject = new Map((classCoefficients ?? []).map((c) => [c.subject_id, c.coefficient]))
  const appreciationByStudent = new Map(
    (appreciations ?? []).filter((a) => a.subject_id === null).map((a) => [a.student_id, a.appreciation])
  )
  const appreciationByStudentAndSubject = new Map(
    (appreciations ?? [])
      .filter((a): a is typeof a & { subject_id: string } => a.subject_id !== null)
      .map((a) => [`${a.student_id}:${a.subject_id}`, a.appreciation])
  )

  const councilDecisionByStudent = new Map((councilDecisions ?? []).map((d) => [d.student_id, d]))

  const absencesByStudent = new Map<string, { justified: number; unjustified: number }>()
  for (const a of absences ?? []) {
    const entry = absencesByStudent.get(a.student_id) ?? { justified: 0, unjustified: 0 }
    if (a.is_justified) entry.justified++
    else entry.unjustified++
    absencesByStudent.set(a.student_id, entry)
  }

  // Une matière peut avoir plusieurs notes (devoir, composition...) : on en
  // fait d'abord une moyenne pondérée par le poids de chaque type de note,
  // avant d'appliquer le coefficient de la matière.
  const entriesBySubject = new Map<string, { score: number; weight: number }[]>()
  for (const g of grades ?? []) {
    const key = `${g.student_id}:${g.subject_id}`
    const list = entriesBySubject.get(key) ?? []
    list.push({ score: Number(g.score), weight: weightByGradeType.get(g.grade_type_id) ?? 1 })
    entriesBySubject.set(key, list)
  }

  function subjectAverage(studentId: string, subjectId: string): number | null {
    const entries = entriesBySubject.get(`${studentId}:${subjectId}`)
    if (!entries || entries.length === 0) return null
    const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
    const totalWeighted = entries.reduce((sum, e) => sum + e.score * e.weight, 0)
    return totalWeight > 0 ? totalWeighted / totalWeight : null
  }

  const classAverageBySubject = new Map<string, number | null>()
  for (const subj of subjects ?? []) {
    const scores = (students ?? [])
      .map((s) => subjectAverage(s.id, subj.id))
      .filter((v): v is number => v !== null)
    classAverageBySubject.set(subj.id, scores.length > 0 ? scores.reduce((sum, v) => sum + v, 0) / scores.length : null)
  }

  const bulletins: StudentBulletin[] = (students ?? []).map((s) => {
    const subjectGrades: SubjectGrade[] = (subjects ?? []).map((subj) => {
      const score = subjectAverage(s.id, subj.id)
      const coefficient = coefficientBySubject.get(subj.id) ?? subj.coefficient
      return {
        subjectName: subj.name,
        coefficient,
        score,
        weighted: score !== null ? score * coefficient : null,
        classAverage: classAverageBySubject.get(subj.id) ?? null,
        appreciation: appreciationByStudentAndSubject.get(`${s.id}:${subj.id}`) ?? null,
      }
    })

    const graded = subjectGrades.filter((sg) => sg.score !== null)
    const totalCoef = graded.reduce((sum, sg) => sum + sg.coefficient, 0)
    const totalWeighted = graded.reduce((sum, sg) => sum + (sg.weighted ?? 0), 0)
    const average = totalCoef > 0 ? totalWeighted / totalCoef : null

    const absenceCounts = absencesByStudent.get(s.id) ?? { justified: 0, unjustified: 0 }
    const councilDecision = councilDecisionByStudent.get(s.id)

    return {
      studentId: s.id,
      studentName: `${s.first_name} ${s.last_name}`,
      className,
      subjects: subjectGrades,
      average,
      rank: null,
      rankedOutOf: 0,
      mention: mentionFor(average),
      appreciation: appreciationByStudent.get(s.id) ?? null,
      absencesJustified: absenceCounts.justified,
      absencesUnjustified: absenceCounts.unjustified,
      absencesScope,
      councilDecision: (councilDecision?.decision as StudentBulletin['councilDecision']) ?? null,
      councilComment: councilDecision?.comment ?? null,
    }
  })

  const ranked = [...bulletins]
    .filter((b) => b.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0))

  ranked.forEach((b, i) => {
    const target = bulletins.find((x) => x.studentId === b.studentId)
    if (target) {
      target.rank = i + 1
      target.rankedOutOf = ranked.length
    }
  })

  return { className, bulletins }
}
