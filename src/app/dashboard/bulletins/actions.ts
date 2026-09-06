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

  // Pas d'upsert avec onConflict : l'unicité de l'appréciation générale est
  // un index partiel (WHERE subject_id IS NULL, coexiste avec l'index
  // partiel par matière de dashboard/notes/actions.ts) — Postgres n'infère
  // pas un index partiel depuis ON CONFLICT (colonnes) sans y répéter la
  // clause WHERE, ce que l'upsert de supabase-js ne permet pas d'exprimer.
  const { data: existing } = await supabase
    .from('bulletin_appreciations')
    .select('id')
    .eq('student_id', studentId)
    .eq('school_year_id', schoolYear.id)
    .eq('trimester', trimester)
    .is('subject_id', null)
    .maybeSingle()

  const { error } = existing
    ? await supabase
        .from('bulletin_appreciations')
        .update({ appreciation: appreciation.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    : await supabase.from('bulletin_appreciations').insert({
        school_id: school.id,
        student_id: studentId,
        school_year_id: schoolYear.id,
        trimester,
        appreciation: appreciation.trim() || null,
      })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bulletins')
  return { success: true }
}
