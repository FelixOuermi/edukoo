'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { signUp } from '../actions'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3aed] flex items-center justify-center mb-4 shadow-lg shadow-violet-300">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SchoolPro</h1>
          <p className="text-gray-500 mt-2 text-center">
            Créez votre espace école en 2 minutes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-violet-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Inscription de l&apos;école
          </h2>

          {state?.pendingConfirmation ? (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              Compte créé. Vérifiez votre boîte email pour confirmer votre adresse, puis
              connectez-vous.
            </p>
          ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;école
              </label>
              <input
                type="text"
                name="schoolName"
                required
                placeholder="Ex : Collège Excellence"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du directeur / de la directrice
              </label>
              <input
                type="text"
                name="directorName"
                required
                placeholder="Ex : M. Kouassi Jean"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="directeur@ecole.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
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
              {pending ? 'Création...' : 'Créer mon école — Essai gratuit 30 jours'}
            </button>
          </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-[#7c3aed] font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
