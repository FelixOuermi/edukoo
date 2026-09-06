import { createClient } from '@/lib/supabase/server'
import { computeClassBulletins } from '@/lib/bulletin'

export type AtRiskFactorKey = 'averageDrop' | 'lowAverage' | 'highAbsences' | 'discipline'

export interface AtRiskStudent {
  studentId: string
  studentName: string
  className: string
  average: number | null
  previousAverage: number | null
  unjustifiedAbsences: number
  disciplineCount: number
  score: number
  factors: AtRiskFactorKey[]
}

// Seuils fixes et volontairement simples (pas de configuration par école) :
// l'objectif est un signal explicable en une phrase à un directeur non
// technicien, pas un modèle ajustable. À revoir avec des retours terrain
// plutôt qu'en théorie.
const AVERAGE_DROP_THRESHOLD = 2 // points sur 20, d'une période à l'autre
const LOW_AVERAGE_THRESHOLD = 8 // /20

// Signaux disponibles sans IA externe : chute de moyenne, moyenne basse,
// absences non justifiées au-delà du seuil déjà configuré par l'école
// (schools.absence_alert_threshold, réutilisé ici sur la période plutôt
// que sur le mois calendaire), sanctions récentes. Le score est le nombre
// de facteurs déclenchés — pas de pondération : un directeur doit pouvoir
// retrouver le calcul de tête.
export async function computeAtRiskStudents({
  schoolId,
  schoolYearId,
  trimester,
  absenceAlertThreshold,
  classId,
}: {
  schoolId: string
  schoolYearId: string
  trimester: number
  absenceAlertThreshold: number
  // Limite le calcul à une seule classe (fiche élève) plutôt que tout
  // l'établissement (vue direction) — même logique, périmètre réduit.
  classId?: string
}): Promise<AtRiskStudent[]> {
  const supabase = await createClient()

  const classesQuery = supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name')
  const { data: classes } = classId ? await classesQuery.eq('id', classId) : await classesQuery
  if (!classes || classes.length === 0) return []

  const [currentByClass, previousByClass] = await Promise.all([
    Promise.all(classes.map((c) => computeClassBulletins({ schoolId, classId: c.id, schoolYearId, trimester }))),
    trimester > 1
      ? Promise.all(classes.map((c) => computeClassBulletins({ schoolId, classId: c.id, schoolYearId, trimester: trimester - 1 })))
      : Promise.resolve([]),
  ])

  const previousAverageByStudent = new Map<string, number>()
  for (const { bulletins } of previousByClass) {
    for (const b of bulletins) {
      if (b.average !== null) previousAverageByStudent.set(b.studentId, b.average)
    }
  }

  // Même fenêtre de dates que les absences des bulletins ci-dessus
  // (computeClassBulletins) : période si elle existe, sinon année entière.
  const [{ data: period }, { data: schoolYear }] = await Promise.all([
    supabase.from('periods').select('start_date, end_date').eq('school_id', schoolId).eq('school_year_id', schoolYearId).eq('number', trimester).maybeSingle(),
    supabase.from('school_years').select('start_date, end_date').eq('id', schoolYearId).maybeSingle(),
  ])
  const disciplineRange = period ?? schoolYear

  const { data: disciplineRecords } = disciplineRange
    ? await supabase
        .from('disciplinary_records')
        .select('student_id')
        .eq('school_id', schoolId)
        .gte('incident_date', disciplineRange.start_date)
        .lte('incident_date', disciplineRange.end_date)
    : { data: [] as { student_id: string }[] }

  const disciplineCountByStudent = new Map<string, number>()
  for (const r of disciplineRecords ?? []) {
    disciplineCountByStudent.set(r.student_id, (disciplineCountByStudent.get(r.student_id) ?? 0) + 1)
  }

  const results: AtRiskStudent[] = []
  for (const { className, bulletins } of currentByClass) {
    for (const b of bulletins) {
      const previousAverage = previousAverageByStudent.get(b.studentId) ?? null
      const disciplineCount = disciplineCountByStudent.get(b.studentId) ?? 0

      const factors: AtRiskFactorKey[] = []
      if (previousAverage !== null && b.average !== null && previousAverage - b.average >= AVERAGE_DROP_THRESHOLD) {
        factors.push('averageDrop')
      }
      if (b.average !== null && b.average < LOW_AVERAGE_THRESHOLD) {
        factors.push('lowAverage')
      }
      if (b.absencesUnjustified >= absenceAlertThreshold) {
        factors.push('highAbsences')
      }
      if (disciplineCount > 0) {
        factors.push('discipline')
      }

      if (factors.length > 0) {
        results.push({
          studentId: b.studentId,
          studentName: b.studentName,
          className,
          average: b.average,
          previousAverage,
          unjustifiedAbsences: b.absencesUnjustified,
          disciplineCount,
          score: factors.length,
          factors,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
