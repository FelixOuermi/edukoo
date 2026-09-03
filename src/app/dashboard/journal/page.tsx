import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export default async function JournalPage() {
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().journalPage

  const { data: entries } = await supabase
    .from('audit_log')
    .select('*')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t.tableDate}</th>
              <th className="px-4 py-3 font-medium">{t.tableAuthor}</th>
              <th className="px-4 py-3 font-medium">{t.tableAction}</th>
              <th className="px-4 py-3 font-medium">{t.tableDetails}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(entries ?? []).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{e.actor_name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-[#7c3aed]">{e.action}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.details ?? '—'}</td>
              </tr>
            ))}
            {(entries ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  {t.noEntries}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
