'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export async function createAnnouncement(_prevState: unknown, formData: FormData) {
  const { school, role, teacherName: actorName } = await getCurrentSchool()
  const t = getDictionary().errors
  if (role !== 'director') return { error: t.directorOnlyAnnouncementPublish }

  const title = (formData.get('title') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  if (!title || !body) return { error: t.titleAndMessageRequired }

  const supabase = await createClient()
  const { error } = await supabase.from('announcements').insert({
    school_id: school.id,
    author_name: actorName,
    title,
    body,
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/annonces')
  revalidatePath('/espace-parent')
  revalidatePath('/espace-eleve')
  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  const { school, role } = await getCurrentSchool()
  if (role !== 'director') return { error: getDictionary().errors.directorOnlyAnnouncementDelete }

  const supabase = await createClient()
  const { error } = await supabase.from('announcements').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/annonces')
  revalidatePath('/espace-parent')
  revalidatePath('/espace-eleve')
  return { success: true }
}
