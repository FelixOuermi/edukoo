import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#7c3aed] flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-800">Edukoo</span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/faq" className="text-sm text-gray-500 hover:text-[#7c3aed] font-medium">
            FAQ
          </Link>
          <Link href="/guide" className="text-sm text-gray-500 hover:text-[#7c3aed] font-medium">
            Guide
          </Link>
          <Link href="/confidentialite" className="text-sm text-gray-500 hover:text-[#7c3aed] font-medium">
            Confidentialité
          </Link>
          <Link href="/cgu" className="text-sm text-gray-500 hover:text-[#7c3aed] font-medium">
            CGU
          </Link>
        </div>
        <p className="text-sm text-gray-400">© Edukoo 2026 — Gestion scolaire Afrique francophone</p>
      </div>
    </footer>
  )
}
