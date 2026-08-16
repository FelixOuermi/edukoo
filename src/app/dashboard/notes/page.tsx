import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { GradesForm } from './grades-form'

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string; trimestre?: string; matiere?: string }>
}) {
  const { classe, trimestre, matiere } = await searchParams
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  const [{ data: classes }, { data: subjects }] = await Promise.all([
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('id, name').eq('school_id', school.id).order('name'),
  ])

  const classId = classe || classes?.[0]?.id
  const subjectId = matiere || subjects?.[0]?.id
  const trimester = Number(trimestre || 1)

  let students: { id: string; name: string; score: number | null }[] = []

  if (classId && subjectId && schoolYear) {
    const { data: classStudents } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('last_name')

    const { data: existingGrades } = await supabase
      .from('grades')
      .select('student_id, score')
      .eq('subject_id', subjectId)
      .eq('school_year_id', schoolYear.id)
      .eq('trimester', trimester)

    const gradeByStudent = new Map((existingGrades ?? []).map((g) => [g.student_id, Number(g.score)]))

    students = (classStudents ?? []).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      score: gradeByStudent.get(s.id) ?? null,
    }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notes</h1>

      <form method="get" className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select
          name="classe"
          defaultValue={classId ?? ''}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          {(classes ?? []).map((c) => (
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
          {(subjects ?? []).map((s) => (
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
      ) : classId && subjectId ? (
        <GradesForm classId={classId} subjectId={subjectId} trimester={trimester} students={students} />
      ) : (
        <p className="text-sm text-gray-400">Créez d&apos;abord une classe et une matière.</p>
      )}
    </div>
  )
}
