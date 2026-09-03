'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'

export interface OnboardingStep {
  key: string
  label: string
  href: string
  done: boolean
}

export function OnboardingChecklist({
  schoolId,
  title,
  stepsCompletedTemplate,
  closeLabel,
  steps,
}: {
  schoolId: string
  title: string
  stepsCompletedTemplate: string
  closeLabel: string
  steps: OnboardingStep[]
}) {
  const storageKey = `edukoo_onboarding_dismissed_${schoolId}`
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === '1') setDismissed(true)
    } catch {
      // localStorage indisponible (navigation privée...) : on garde la checklist visible.
    }
  }, [storageKey])

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length

  if (allDone || dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // Rien à faire : la checklist restera visible au prochain chargement.
    }
    setDismissed(true)
  }

  return (
    <div className="bg-white rounded-xl border border-violet-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex-1 flex items-center justify-between gap-3 text-left"
        >
          <div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {stepsCompletedTemplate.replace('{done}', String(doneCount)).replace('{total}', String(steps.length))}
            </p>
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          )}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
          aria-label={closeLabel}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {!collapsed && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {steps.map((s) => (
            <li key={s.key}>
              <Link href={s.href} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    s.done ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  {s.done && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className={`text-sm ${s.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {s.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
