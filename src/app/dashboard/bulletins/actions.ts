'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function saveAppreciation(
  studentId: string,
  trimester: number,
  appreciation: string
): Promise<{ error?: string; success?: boolean }> {
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) return { error: 'Aucune année scolaire active.' }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!student) return { error: 'Élève introuvable.' }

  const { error } = await supabase.from('bulletin_appreciations').upsert(
    {
      school_id: school.id,
      student_id: studentId,
      school_year_id: schoolYear.id,
      trimester,
      appreciation: appreciation.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,school_year_id,trimester' }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bulletins')
  return { success: true }
}
