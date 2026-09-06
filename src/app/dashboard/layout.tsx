import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Sidebar, MobileNav } from '@/components/sidebar'
import { OfflineBanner } from '@/components/offline-banner'
import { OfflineSync } from '@/components/offline-sync'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { school, role } = await getCurrentSchool()

  const isTrial = school.plan === 'trial'
  // Server Component rendu une fois par requête : lire l'heure réelle ici est
  // voulu (pas un souci d'idempotence de re-rendu côté client), d'où le disable.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const daysRemaining = school.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(school.trial_ends_at).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null

  const trialExpired = isTrial && school.trial_ends_at !== null && new Date(school.trial_ends_at) < new Date()
  const paidExpired =
    !isTrial && school.plan_expires_at !== null && new Date(school.plan_expires_at) < new Date()
  const pathname = (await headers()).get('x-pathname') ?? ''
  const isUpgradePage = pathname === '/dashboard/upgrade'

  if ((trialExpired || paidExpired) && !isUpgradePage) {
    if (role === 'director') redirect('/dashboard/upgrade')

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center bg-white border border-gray-200 rounded-xl p-8">
          <p className="text-lg font-semibold text-gray-900">Abonnement expiré</p>
          <p className="text-sm text-gray-500 mt-2">
            L&apos;essai gratuit ou l&apos;abonnement de {school.name} est arrivé à échéance. Merci de
            contacter votre directeur ou directrice pour réactiver l&apos;accès.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar schoolName={school.name} role={role} />
      <MobileNav role={role} />
      <main className="md:pl-64 pb-20 md:pb-0">
        <OfflineBanner message={getDictionary().common.offlineMessage} />
        <OfflineSync />
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
              {role === 'director' && (
                <Link
                  href="/dashboard/upgrade"
                  className="shrink-0 inline-flex items-center gap-1 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  Choisir un plan →
                </Link>
              )}
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
