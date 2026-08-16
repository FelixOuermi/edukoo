import { Sidebar, MobileNav } from '@/components/sidebar'
import { getCurrentSchool } from '@/lib/school'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { school } = await getCurrentSchool()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar schoolName={school.name} />
      <MobileNav />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
