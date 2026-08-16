import Link from 'next/link'
import {
  GraduationCap,
  FileCheck,
  TrendingUp,
  MessageCircle,
  Smartphone,
  Check,
} from 'lucide-react'

const ADVANTAGES = [
  { icon: FileCheck, text: 'Bulletins générés en 1 clic' },
  { icon: TrendingUp, text: 'Suivi des impayés en temps réel' },
  { icon: MessageCircle, text: 'Absences et alertes WhatsApp parents' },
  { icon: Smartphone, text: 'Paiements Orange Money et Moov Money' },
]

const PLANS = [
  {
    name: 'Starter',
    price: '50 000',
    period: 'FCFA / an',
    detail: "Jusqu'à 150 élèves",
    features: ['Gestion élèves & classes', 'Paiements & reçus', 'Bulletins PDF', 'Support email'],
    highlighted: false,
  },
  {
    name: 'School',
    price: '120 000',
    period: 'FCFA / an',
    detail: "Jusqu'à 500 élèves",
    features: ['Tout Starter', 'Alertes WhatsApp parents', 'Import Excel en masse', 'Support prioritaire'],
    highlighted: true,
  },
  {
    name: 'Premium',
    price: '250 000',
    period: 'FCFA / an',
    detail: 'Élèves illimités',
    features: ['Tout School', 'Multi-établissements', 'Statistiques avancées', 'Support dédié'],
    highlighted: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">Edukoo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium bg-[#7c3aed] hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-violet-50 to-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Gérez votre école. <span className="text-[#7c3aed]">Libérez votre temps.</span>
          </h1>
          <p className="text-lg text-gray-500 mt-6 max-w-2xl mx-auto">
            Le logiciel de gestion scolaire pensé pour les établissements privés en Afrique
            francophone.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-7 py-3.5 rounded-lg text-base transition-colors shadow-lg shadow-violet-200"
            >
              Essai gratuit 30 jours
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {ADVANTAGES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4 bg-violet-50 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-[#7c3aed] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-gray-800">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tarifs simples, en FCFA</h2>
            <p className="text-gray-500 mt-3">Un abonnement annuel adapté à la taille de votre établissement.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border ${
                  plan.highlighted
                    ? 'border-[#7c3aed] bg-white shadow-xl shadow-violet-100 sm:scale-105'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-semibold text-[#7c3aed] bg-violet-100 px-3 py-1 rounded-full mb-4">
                    Le plus populaire
                  </span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.detail}</p>
                <p className="mt-5">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>{' '}
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-7 block text-center font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    plan.highlighted
                      ? 'bg-[#7c3aed] hover:bg-violet-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#7c3aed] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">Edukoo</span>
          </div>
          <p className="text-sm text-gray-400">© Edukoo 2026 — Gestion scolaire Afrique francophone</p>
        </div>
      </footer>
    </div>
  )
}
