import { GraduationCap } from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import { getCurrentStudent } from '@/lib/portal'
import { getDictionary } from '@/lib/i18n'
import { OfflineBanner } from '@/components/offline-banner'

export default async function EspaceEleveLayout({ children }: { children: React.ReactNode }) {
  const { school, student } = await getCurrentStudent()
  const t = getDictionary()

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner message={t.common.offlineMessage} />
      <header className="bg-[#4c1d95] text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Edukoo</p>
              <p className="text-xs text-violet-300 leading-tight">{school.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-violet-200 hidden sm:inline">
              {student.first_name} {student.last_name}
            </span>
            <form action={signOut}>
              <button type="submit" className="text-sm font-medium text-violet-200 hover:text-white">
                {t.common.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
