'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export async function createLessonLog(_prevState: unknown, formData: FormData) {
  const { school, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().errors

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const lessonDate = (formData.get('lessonDate') as string) || new Date().toISOString().slice(0, 10)
  const lessonContent = (formData.get('lessonContent') as string)?.trim()
  const homework = (formData.get('homework') as string)?.trim() || null
  const homeworkDueDate = (formData.get('homeworkDueDate') as string) || null

  if (!classId || !subjectId || !lessonContent) {
    return { error: t.classSubjectContentRequired }
  }

  const [{ data: klass }, { data: subject }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
  ])
  if (!klass || !subject) return { error: t.classOrSubjectNotFound }

  if (role !== 'director') {
    const { data: assigned } = await supabase
      .from('teacher_subjects')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .maybeSingle()
    if (!assigned) return { error: t.notAssignedToClassSubject }
  }

  const { error } = await supabase.from('lesson_logs').insert({
    school_id: school.id,
    class_id: classId,
    subject_id: subjectId,
    teacher_id: teacherId,
    lesson_date: lessonDate,
    lesson_content: lessonContent,
    homework,
    homework_due_date: homeworkDueDate,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/cahier-de-texte')
  return { success: true }
}

export async function deleteLessonLog(id: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase.from('lesson_logs').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/cahier-de-texte')
  return { success: true }
}
