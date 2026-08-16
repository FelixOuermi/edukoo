import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'

export default async function EnseignantsPage() {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, name, phone, email, is_active')
    .eq('school_id', school.id)
    .order('name')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Enseignants</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(teachers ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-gray-900 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-gray-600">{t.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{t.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Aucun enseignant enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
