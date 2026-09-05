import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base sm:text-lg text-gray-900 truncate">Edukoo</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
          >
            Connexion
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-medium bg-[#7c3aed] hover:bg-violet-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </header>
  )
}
