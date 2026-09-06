'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Wallet,
  ClipboardList,
  CalendarX,
  CalendarDays,
  Users,
  Settings,
  LogOut,
  Star,
  ScrollText,
  Megaphone,
  BarChart3,
  NotebookPen,
  Bus,
  DoorOpen,
  HelpCircle,
  Banknote,
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import type { TeacherRole } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary()

const NAV_ITEMS = [
  { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, directorOnly: false },
  { href: '/dashboard/eleves', label: t.nav.students, icon: GraduationCap, directorOnly: false },
  { href: '/dashboard/classes', label: t.nav.classes, icon: BookOpen, directorOnly: false },
  { href: '/dashboard/scolarite', label: t.nav.tuition, icon: Wallet, directorOnly: true },
  { href: '/dashboard/services', label: t.nav.services, icon: Bus, directorOnly: true },
  { href: '/dashboard/bulletins', label: t.nav.grades, icon: ClipboardList, directorOnly: false },
  { href: '/dashboard/cahier-de-texte', label: t.nav.lessonLog, icon: NotebookPen, directorOnly: false },
  { href: '/dashboard/statistiques', label: t.nav.statistics, icon: BarChart3, directorOnly: true },
  { href: '/dashboard/absences', label: t.nav.absences, icon: CalendarX, directorOnly: false },
  { href: '/dashboard/emploi-du-temps', label: t.nav.timetable, icon: CalendarDays, directorOnly: false },
  { href: '/dashboard/salles', label: t.nav.rooms, icon: DoorOpen, directorOnly: false },
  { href: '/dashboard/annonces', label: t.nav.announcements, icon: Megaphone, directorOnly: false },
  { href: '/dashboard/enseignants', label: t.nav.teachers, icon: Users, directorOnly: false },
  { href: '/dashboard/personnel-paie', label: t.nav.payroll, icon: Banknote, directorOnly: true },
  { href: '/dashboard/journal', label: t.nav.auditLog, icon: ScrollText, directorOnly: true },
  { href: '/dashboard/parametres', label: t.nav.settings, icon: Settings, directorOnly: true },
]

const MOBILE_ITEMS = [
  { href: '/dashboard', label: t.nav.home, icon: LayoutDashboard, directorOnly: false },
  { href: '/dashboard/eleves', label: t.nav.students, icon: GraduationCap, directorOnly: false },
  { href: '/dashboard/scolarite', label: t.nav.tuitionShort, icon: Wallet, directorOnly: true },
  { href: '/dashboard/absences', label: t.nav.absences, icon: CalendarX, directorOnly: false },
  { href: '/dashboard/parametres', label: t.nav.settingsShort, icon: Settings, directorOnly: true },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

export function Sidebar({ schoolName, role }: { schoolName: string; role: TeacherRole }) {
  const pathname = usePathname()
  const items = NAV_ITEMS.filter((item) => !item.directorOnly || role === 'director')

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#4c1d95] text-white">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-violet-800/60">
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-white">Edukoo</span>
      </div>

      <div className="px-6 py-3 text-xs text-violet-300 truncate border-b border-violet-800/40">
        {schoolName}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-violet-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          )
        })}
      </nav>

      {role === 'director' && (
        <div className="px-3 pt-4 border-t border-violet-800/60">
          <Link
            href="/dashboard/upgrade"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(pathname, '/dashboard/upgrade')
                ? 'bg-amber-400/15 text-amber-300'
                : 'text-amber-400 hover:bg-amber-400/10'
            }`}
          >
            <Star className="w-[18px] h-[18px]" />
            {t.nav.upgrade}
          </Link>
        </div>
      )}

      <div className="px-3 pt-2">
        <Link
          href="/guide"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HelpCircle className="w-[18px] h-[18px]" />
          {t.nav.guide}
        </Link>
      </div>

      <form action={signOut} className="px-3 py-4">
        <button
          type="submit"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-200 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          {t.common.logout}
        </button>
      </form>
    </aside>
  )
}

export function MobileNav({ role }: { role: TeacherRole }) {
  const pathname = usePathname()
  const items = MOBILE_ITEMS.filter((item) => !item.directorOnly || role === 'director')

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#4c1d95] border-t border-violet-800/60 flex justify-around items-center h-16 z-50">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] ${
              active ? 'text-white' : 'text-violet-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
