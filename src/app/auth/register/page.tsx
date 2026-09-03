'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { signUp } from '../actions'
import { getDictionary } from '@/lib/i18n'

const t = getDictionary()

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-4 shadow-lg shadow-violet-300">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Edukoo</h1>
          <p className="text-gray-500 mt-2 text-center">
            {t.auth.register.tagline}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-violet-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t.auth.register.title}
          </h2>

          {state?.pendingConfirmation ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              {t.auth.register.pendingConfirmation}
            </p>
          ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.register.schoolNameLabel}
              </label>
              <input
                type="text"
                name="schoolName"
                required
                placeholder={t.auth.register.schoolNamePlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.register.directorNameLabel}
              </label>
              <input
                type="text"
                name="directorName"
                required
                placeholder={t.auth.register.directorNamePlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.register.emailLabel}
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder={t.auth.register.emailPlaceholder}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.auth.register.passwordLabel}
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-[#7c3aed] hover:bg-violet-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {pending ? t.auth.register.submitting : t.auth.register.submit}
            </button>

            <p className="text-center text-xs text-gray-400">
              {t.auth.register.termsPrefix}{' '}
              <Link href="/cgu" className="text-gray-600 hover:text-[#7c3aed] underline">
                {t.auth.register.termsCgu}
              </Link>{' '}
              {t.auth.register.termsAnd}{' '}
              <Link href="/confidentialite" className="text-gray-600 hover:text-[#7c3aed] underline">
                {t.auth.register.termsPrivacy}
              </Link>
              .
            </p>
          </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            {t.auth.register.alreadyHaveAccount}{' '}
            <Link href="/auth/login" className="text-[#7c3aed] font-medium hover:underline">
              {t.auth.register.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
