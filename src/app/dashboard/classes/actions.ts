'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool, requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export async function createClass(_prevState: unknown, formData: FormData) {
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const level = formData.get('level') as string
  const maxStudents = Number(formData.get('maxStudents') || 50)

  if (!name) return { error: getDictionary().errors.classNameRequired }

  const { error } = await supabase.from('classes').insert({
    school_id: school.id,
    school_year_id: schoolYear?.id ?? null,
    name,
    level: level || null,
    max_students: maxStudents,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function createSubject(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const coefficient = Number(formData.get('coefficient') || 1)

  if (!name) return { error: getDictionary().errors.subjectNameRequired }

  const { error } = await supabase.from('subjects').insert({
    school_id: school.id,
    name,
    coefficient,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  return { success: true }
}

export async function createGradeType(_prevState: unknown, formData: FormData) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const name = formData.get('name') as string
  const weight = Number(formData.get('weight') || 1)

  const t = getDictionary().errors
  if (!name) return { error: t.gradeTypeNameRequired }
  if (!weight || weight <= 0) return { error: t.weightMustBePositive }

  const { error } = await supabase.from('grade_types').insert({
    school_id: school.id,
    name,
    weight,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/notes')
  return { success: true }
}

export async function deleteGradeType(id: string) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const t = getDictionary().errors
  const { count } = await supabase.from('grade_types').select('id', { count: 'exact', head: true }).eq('school_id', school.id)
  if ((count ?? 0) <= 1) {
    return { error: t.cannotDeleteLastGradeType }
  }

  const { count: usageCount } = await supabase
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .eq('grade_type_id', id)
  if ((usageCount ?? 0) > 0) {
    return { error: t.cannotDeleteGradeTypeInUseTemplate.replace('{count}', String(usageCount)) }
  }

  const { error } = await supabase.from('grade_types').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/notes')
  return { success: true }
}

export async function saveClassCoefficients(_prevState: unknown, formData: FormData) {
  const { school } = await requireDirector()
  const supabase = await createClient()

  const classId = formData.get('classId') as string
  const subjectIds = formData.getAll('subjectId') as string[]

  const t = getDictionary().errors
  if (!classId) return { error: t.classRequired }

  const [{ data: klass }, { data: validSubjects }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('school_id', school.id).in('id', subjectIds),
  ])

  if (!klass) return { error: t.classNotFound }
  const validSubjectIds = new Set((validSubjects ?? []).map((s) => s.id))

  const rows = subjectIds
    .filter((id) => validSubjectIds.has(id))
    .map((subjectId) => {
      const coefficient = Number(formData.get(`coefficient_${subjectId}`))
      return { subjectId, coefficient }
    })
    .filter((r) => r.coefficient > 0)
    .map((r) => ({
      school_id: school.id,
      class_id: classId,
      subject_id: r.subjectId,
      coefficient: r.coefficient,
    }))

  if (rows.length === 0) return { error: t.noValidCoefficients }

  const { error } = await supabase.from('class_subjects').upsert(rows, { onConflict: 'class_id,subject_id' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/bulletins')
  return { success: true }
}
