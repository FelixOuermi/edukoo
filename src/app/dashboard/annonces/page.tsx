import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewAnnouncementForm, DeleteAnnouncementButton } from './announcement-form'

export default async function AnnoncesPage() {
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().announcementsPage
  const isDirector = role === 'director'

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
      <p className="text-gray-500 text-sm">
        {t.visibilityNote}
      </p>

      {isDirector && <NewAnnouncementForm />}

      <div className="space-y-3">
        {(announcements ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-5">
            {t.noAnnouncements}
          </p>
        ) : (
          (announcements ?? []).map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{a.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.author_name} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {isDirector && <DeleteAnnouncementButton id={a.id} />}
              </div>
              <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
