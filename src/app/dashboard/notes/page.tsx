import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { GradesForm } from './grades-form'
import { ImportGradesButton } from './import-grades-button'

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; trimestre?: string; matiere?: string }>
}) {
  const { classe, trimestre, matiere } = await searchParams
  const { school, schoolYear, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const isDirector = role === 'director'

  const [{ data: allClasses }, { data: allSubjects }, { data: gradeTypes }, { data: assignments }] =
    await Promise.all([
      supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
      supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
      supabase.from('grade_types').select('id, name, weight').eq('school_id', school.id).order('created_at'),
      isDirector
        ? Promise.resolve({ data: [] as { class_id: string; subject_id: string }[] })
        : supabase.from('teacher_subjects').select('class_id, subject_id').eq('teacher_id', teacherId),
    ])

  const assignedClassIds = new Set((assignments ?? []).map((a) => a.class_id))
  const assignedSubjectIdsByClass = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    const set = assignedSubjectIdsByClass.get(a.class_id) ?? new Set<string>()
    set.add(a.subject_id)
    assignedSubjectIdsByClass.set(a.class_id, set)
  }

  const classes = isDirector ? (allClasses ?? []) : (allClasses ?? []).filter((c) => assignedClassIds.has(c.id))
  const classId = classe || classes[0]?.id
  const subjects = isDirector
    ? (allSubjects ?? [])
    : (allSubjects ?? []).filter((s) => classId && assignedSubjectIdsByClass.get(classId)?.has(s.id))
  const subjectId = matiere || subjects[0]?.id
  const trimester = Number(trimestre || 1)

  const hasNoAssignment = !isDirector && assignedClassIds.size === 0

  let students: { id: string; name: string; scores: Record<string, number | null> }[] = []

  if (classId && subjectId && schoolYear) {
    const { data: classStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('last_name')

    const { data: existingGrades } = await supabase
      .from('grades')
      .select('student_id, grade_type_id, score')
      .eq('subject_id', subjectId)
      .eq('school_year_id', schoolYear.id)
      .eq('trimester', trimester)

    const scoreMap = new Map<string, number>()
    for (const g of existingGrades ?? []) {
      scoreMap.set(`${g.student_id}:${g.grade_type_id}`, Number(g.score))
    }

    students = (classStudents ?? []).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      scores: Object.fromEntries(
        (gradeTypes ?? []).map((gt) => [gt.id, scoreMap.get(`${s.id}:${gt.id}`) ?? null])
      ),
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notes</h1>

      {hasNoAssignment ? (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Aucune classe ni matière ne vous a été assignée. Demandez à votre directeur de vous affecter depuis la page Enseignants.
        </p>
      ) : (
        <>
          <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
            <select
              name="classe"
              defaultValue={classId ?? ''}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="matiere"
              defaultValue={subjectId ?? ''}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              name="trimestre"
              defaultValue={String(trimester)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            >
              <option value="1">Trimestre 1</option>
              <option value="2">Trimestre 2</option>
              <option value="3">Trimestre 3</option>
            </select>
            <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">
              Afficher
            </button>
          </form>

          {!schoolYear ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Aucune année scolaire active. Configurez-la dans Paramètres avant de saisir des notes.
            </p>
          ) : (gradeTypes ?? []).length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Aucun type de note configuré. Ajoutez-en dans Classes &amp; Matières avant de saisir des notes.
            </p>
          ) : classId && subjectId ? (
            <>
              <div className="flex justify-end">
                <ImportGradesButton
                  key={`${classId}:${subjectId}:${trimester}`}
                  classId={classId}
                  subjectId={subjectId}
                  trimester={trimester}
                  gradeTypeNames={(gradeTypes ?? []).map((gt) => gt.name)}
                />
              </div>
              <GradesForm
                key={`${classId}:${subjectId}:${trimester}`}
                classId={classId}
                subjectId={subjectId}
                trimester={trimester}
                gradeTypes={gradeTypes ?? []}
                students={students}
              />
            </>
          ) : (
            <p className="text-sm text-gray-400">Créez d&apos;abord une classe et une matière.</p>
          )}
        </>
      )}
    </div>
  )
}
