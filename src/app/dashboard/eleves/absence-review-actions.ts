'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function reviewAbsenceJustification(id: string, studentId: string, decision: 'approved' | 'rejected') {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase
    .from('absences')
    .update({
      justification_status: decision,
      is_justified: decision === 'approved',
    })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/eleves/${studentId}`)
  revalidatePath('/dashboard/absences')
  return { success: true }
}
