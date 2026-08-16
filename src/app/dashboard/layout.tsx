import Link from 'next/link'
import { Sidebar, MobileNav } from '@/components/sidebar'
import { getCurrentSchool } from '@/lib/school'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { school } = await getCurrentSchool()

  const isTrial = school.plan === 'trial'
  const daysRemaining = school.trial_ends_at
    ? Math.max(
        0,
        Math.ceil((new Date(school.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar schoolName={school.name} />
      <MobileNav />
      <main className="md:pl-64 pb-20 md:pb-0">
        {isTrial && (
          <div className="bg-violet-100 border-b border-violet-200 px-4 py-3">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-sm text-violet-900 text-center sm:text-left">
                🎓 Essai gratuit —{' '}
                <span className="font-semibold">
                  {daysRemaining !== null ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}` : '30 jours'}
                </span>{' '}
                avant expiration.
              </p>
              <Link
                href="/dashboard/upgrade"
                className="shrink-0 inline-flex items-center gap-1 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                Choisir un plan →
              </Link>
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
