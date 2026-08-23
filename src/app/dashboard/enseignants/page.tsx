import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { InviteTeacherForm, TeacherRow } from './teacher-list'

export default async function EnseignantsPage() {
  const { school, role } = await getCurrentSchool()
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, name, phone, email, role, is_active, user_id')
    .eq('school_id', school.id)
    .order('name')

  const isDirector = role === 'director'

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
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              {isDirector && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(teachers ?? []).map((t) => (
              <TeacherRow key={t.id} teacher={t} canManage={isDirector} />
            ))}
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={isDirector ? 6 : 5} className="px-4 py-8 text-center text-gray-400">
                  Aucun enseignant enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isDirector && <InviteTeacherForm />}
    </div>
  )
}
