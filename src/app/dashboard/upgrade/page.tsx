import { Check, MessageCircle } from 'lucide-react'
import { getCurrentSchool } from '@/lib/school'

// TODO: remplacer par le vrai numéro Orange Money / WhatsApp d'Edukoo.
const EDUKOO_PAYMENT_PHONE_DISPLAY = '+226 XX XX XX XX'
const EDUKOO_WHATSAPP_NUMBER = '226XXXXXXXX'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 50000,
    features: [
      "Jusqu'à 150 élèves",
      'Bulletins PDF illimités',
      'Suivi paiements scolarité',
      'Absences + alertes WhatsApp',
      'Support WhatsApp',
    ],
    highlighted: false,
  },
  {
    id: 'school',
    name: 'School',
    price: 120000,
    features: [
      "Jusqu'à 500 élèves",
      'Tout Starter',
      'Import élèves Excel',
      'Rapports avancés',
      'Support prioritaire',
    ],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 250000,
    features: ['Élèves illimités', 'Tout School', 'Multi-utilisateurs', 'Support dédié'],
    highlighted: false,
  },
]

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export default async function UpgradePage() {
  const { school, user } = await getCurrentSchool()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Passer au plan payant</h1>
        <p className="text-gray-500 text-sm mt-1">
          Choisissez le plan adapté à {school.name} et activez-le en quelques minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const waMessage = `Bonjour, je souhaite activer le plan ${plan.name} (${formatFCFA(plan.price)}/an) sur Edukoo pour mon école "${school.name}". Mon email de compte : ${user.email}`
          const waLink = `https://wa.me/${EDUKOO_WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`
          const isCurrent = school.plan === plan.id

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-7 border bg-white flex flex-col ${
                plan.highlighted ? 'border-[#7c3aed] shadow-xl shadow-violet-100 lg:scale-105' : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <span className="inline-block w-fit text-xs font-semibold text-[#7c3aed] bg-violet-100 px-3 py-1 rounded-full mb-4">
                  Populaire
                </span>
              )}
              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <p className="mt-3">
                <span className="text-3xl font-bold text-gray-900">{formatFCFA(plan.price)}</span>
                <span className="text-gray-500 text-sm"> / an</span>
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-[#7c3aed] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent && (
                <span className="mt-6 inline-block w-fit text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Plan actuel
                </span>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Comment payer ?</h3>
                <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                  <li>
                    Envoyez <span className="font-medium text-gray-900">{formatFCFA(plan.price)}</span> sur Orange
                    Money au <span className="font-medium text-gray-900">{EDUKOO_PAYMENT_PHONE_DISPLAY}</span>
                    <br />
                    <span className="text-xs text-gray-400">Référence : {user.email}</span>
                  </li>
                  <li>Confirmez sur WhatsApp</li>
                </ol>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Confirmer sur WhatsApp →
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
