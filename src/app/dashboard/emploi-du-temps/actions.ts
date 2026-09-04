'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { timesOverlap } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'

export async function createTimetableSlot(_prevState: unknown, formData: FormData) {
  const { school, role, schoolYear } = await getCurrentSchool()
  const t = getDictionary().errors
  if (role !== 'director') return { error: t.directorOnlyTimetable }
  if (!schoolYear) return { error: t.noActiveSchoolYear }

  const classId = formData.get('classId') as string
  const subjectId = formData.get('subjectId') as string
  const teacherId = (formData.get('teacherId') as string) || null
  const dayOfWeek = Number(formData.get('dayOfWeek'))
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const room = (formData.get('room') as string) || null

  if (!classId || !subjectId || !dayOfWeek || !startTime || !endTime) {
    return { error: t.classSubjectDayTimeRequired }
  }
  if (startTime >= endTime) return { error: t.endTimeAfterStartTime }

  const supabase = await createClient()

  const [{ data: klass }, { data: subject }, { data: teacher }] = await Promise.all([
    supabase.from('classes').select('id').eq('id', classId).eq('school_id', school.id).maybeSingle(),
    supabase.from('subjects').select('id').eq('id', subjectId).eq('school_id', school.id).maybeSingle(),
    teacherId
      ? supabase.from('teachers').select('id').eq('id', teacherId).eq('school_id', school.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (!klass || !subject) return { error: t.classOrSubjectNotFound }
  if (teacherId && !teacher) return { error: t.classOrSubjectNotFound }

  const { data: existing } = await supabase
    .from('timetable_slots')
    .select('start_time, end_time, room, teacher_id, class_id')
    .eq('school_id', school.id)
    .eq('school_year_id', schoolYear.id)
    .eq('day_of_week', dayOfWeek)

  const conflict = (existing ?? []).find((slot) => {
    if (!timesOverlap(startTime, endTime, slot.start_time, slot.end_time)) return false
    const sameTeacher = teacherId !== null && slot.teacher_id === teacherId
    const sameRoom = room !== null && room !== '' && slot.room === room
    const sameClass = slot.class_id === classId
    return sameTeacher || sameRoom || sameClass
  })

  if (conflict) {
    return { error: t.timetableConflict }
  }

  const { error } = await supabase.from('timetable_slots').insert({
    school_id: school.id,
    school_year_id: schoolYear.id,
    class_id: classId,
    subject_id: subjectId,
    teacher_id: teacherId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    room,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/emploi-du-temps')
  return { success: true }
}

export async function deleteTimetableSlot(id: string) {
  const { school, role } = await getCurrentSchool()
  if (role !== 'director') return { error: getDictionary().errors.directorOnlyTimetable }

  const supabase = await createClient()
  const { error } = await supabase.from('timetable_slots').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/emploi-du-temps')
  return { success: true }
}
