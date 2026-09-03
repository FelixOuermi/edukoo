import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function MissingPrerequisiteNotice({
  message,
  actionLabel,
  href,
  showAction,
}: {
  message: string
  actionLabel: string
  href: string
  showAction: boolean
}) {
  return (
    <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <span>{message}</span>
      {showAction && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap"
        >
          {actionLabel} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}
