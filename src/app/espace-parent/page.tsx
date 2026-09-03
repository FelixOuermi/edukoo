import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentParent } from '@/lib/portal'
import { getDictionary } from '@/lib/i18n'

export default async function EspaceParentPage() {
  const { school, children } = await getCurrentParent()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.portal

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, author_name, created_at')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.myChildren}</h1>
        <p className="text-gray-500 text-sm mt-1">{t.myChildrenSubtitle}</p>
      </div>

      {(announcements ?? []).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">{t.schoolNews}</h2>
          {(announcements ?? []).map((a) => (
            <div key={a.id} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-gray-800">{a.title}</p>
              <p className="text-xs text-gray-400 mb-1">
                {a.author_name} · {new Date(a.created_at).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-5">
          {t.noChildrenLinked}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {children.map(({ student, relationship }) => (
            <Link
              key={student.id}
              href={`/espace-parent/${student.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-[#7c3aed] transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  {student.className ?? dict.studentProfile.noClass}
                  {relationship ? ` · ${relationship}` : ''}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
