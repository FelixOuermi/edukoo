'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export async function saveAppreciation(
  studentId: string,
  trimester: number,
  appreciation: string
): Promise<{ error?: string; success?: boolean }> {
  const { school, schoolYear, role, teacherId } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) return { error: 'Aucune année scolaire active.' }

  const { data: student } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (!student) return { error: 'Élève introuvable.' }

  // Même restriction que la page Bulletins : un enseignant ne peut écrire
  // l'appréciation générale que d'un élève d'une classe où il a au moins
  // une matière affectée (le directeur n'est jamais restreint).
  if (role !== 'director') {
    const { data: assignment } = await supabase
      .from('teacher_subjects')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', student.class_id)
      .maybeSingle()
    if (!assignment) return { error: "Vous n'êtes pas affecté à cette classe." }
  }

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

const VALID_DECISIONS = ['passage', 'redoublement', 'passage_conditionnel']

export async function saveClassCouncilDecision(
  studentId: string,
  decision: string,
  comment: string
): Promise<{ error?: string; success?: boolean }> {
  const { school, schoolYear, role } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) return { error: 'Aucune année scolaire active.' }
  // Décision sensible (détermine si l'élève redouble) : réservée au
  // directeur, comme déjà posé au niveau RLS (0027_class_council_decisions.sql)
  // — vérifié ici aussi pour un message d'erreur clair plutôt qu'une erreur
  // Postgres brute si quelqu'un contourne l'UI.
  if (role !== 'director') return { error: "Seul le directeur peut saisir la décision du conseil de classe." }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .maybeSingle()
  if (!student) return { error: 'Élève introuvable.' }

  const normalizedDecision = VALID_DECISIONS.includes(decision) ? decision : null

  const { error } = await supabase.from('class_council_decisions').upsert(
    {
      school_id: school.id,
      student_id: studentId,
      school_year_id: schoolYear.id,
      decision: normalizedDecision,
      comment: comment.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,school_year_id' }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/bulletins')
  return { success: true }
}
