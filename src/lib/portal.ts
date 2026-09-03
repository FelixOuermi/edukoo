import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface PortalChild {
  relationship: string | null
  student: {
    id: string
    first_name: string
    last_name: string
    class_id: string | null
    className: string | null
  }
}

/**
 * Contexte du portail parent : contrairement à getCurrentSchool() (staff),
 * un parent n'a jamais accès à toute l'école — seulement à ses propres
 * enfants, via parent_students (voir RLS dans supabase/migrations/0010).
 */
export async function getCurrentParent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: parent } = await supabase
    .from('parents')
    .select('id, school_id, name, email')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!parent) redirect('/auth/login')

  const [{ data: school }, { data: schoolYear }, { data: links }] = await Promise.all([
    supabase.from('schools').select('*').eq('id', parent.school_id).single(),
    supabase
      .from('school_years')
      .select('*')
      .eq('school_id', parent.school_id)
      .eq('is_current', true)
      .maybeSingle(),
    supabase
      .from('parent_students')
      .select('relationship, students(id, first_name, last_name, class_id, classes(name))')
      .eq('parent_id', parent.id),
  ])

  const children: PortalChild[] = (links ?? [])
    .map((link) => {
      const student = link.students as unknown as {
        id: string
        first_name: string
        last_name: string
        class_id: string | null
        classes: { name: string } | null
      } | null
      if (!student) return null
      return {
        relationship: link.relationship,
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          class_id: student.class_id,
          className: student.classes?.name ?? null,
        },
      }
    })
    .filter((c): c is PortalChild => c !== null)

  return { user, parent, school: school!, schoolYear, children }
}

/** Vérifie que studentId fait bien partie des enfants de ce parent. */
export async function requireOwnChild(parentId: string, studentId: string) {
  const supabase = await createClient()
  const { data: link } = await supabase
    .from('parent_students')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .maybeSingle()
  return !!link
}

/**
 * Contexte du portail élève : accès en lecture seule à son propre
 * dossier uniquement (voir RLS dans supabase/migrations/0011).
 */
export async function getCurrentStudent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: student } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!student) redirect('/auth/login')

  const [{ data: school }, { data: schoolYear }] = await Promise.all([
    supabase.from('schools').select('*').eq('id', student.school_id).single(),
    supabase
      .from('school_years')
      .select('*')
      .eq('school_id', student.school_id)
      .eq('is_current', true)
      .maybeSingle(),
  ])

  return { user, student, school: school!, schoolYear }
}
