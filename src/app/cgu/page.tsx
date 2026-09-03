import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing-header'
import { MarketingFooter } from '@/components/marketing-footer'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les conditions d'utilisation du logiciel de gestion scolaire Edukoo.",
}

const SECTIONS = [
  {
    title: '1. Objet',
    body: [
      "Les présentes conditions régissent l'utilisation d'Edukoo, logiciel en ligne (SaaS) de gestion administrative pour établissements scolaires privés (écoles primaires, collèges, lycées) en Afrique francophone. En créant un compte, votre établissement accepte ces conditions.",
    ],
  },
  {
    title: '2. Description du service',
    body: [
      "Edukoo permet de gérer les élèves, classes, notes, absences, bulletins, scolarité, emploi du temps, discipline, cahier de textes, communication avec les parents, et de générer des documents administratifs (bulletins, certificats, attestations, convocations, reçus). Certaines fonctionnalités sont réservées au plan payant souscrit (voir Tarifs).",
    ],
  },
  {
    title: '3. Comptes et rôles',
    body: [
      "Un compte école est créé par un directeur ou une directrice, qui peut ensuite inviter du personnel enseignant, des parents et des élèves. Chaque rôle (directeur, enseignant, parent, élève) a un niveau d'accès distinct aux données de l'école, décrit dans notre Politique de confidentialité.",
      "Votre établissement est responsable de la confidentialité des identifiants de ses comptes et de toute activité effectuée depuis ceux-ci. Toute invitation d'un membre du personnel ou d'un parent doit correspondre à une personne réellement autorisée par l'établissement.",
    ],
  },
  {
    title: "4. Exactitude des données saisies",
    body: [
      "Votre établissement est seul responsable de l'exactitude des données qu'il saisit dans Edukoo (élèves, notes, montants de scolarité, documents générés). Edukoo fournit l'outil mais ne vérifie ni ne garantit l'exactitude des informations saisies par l'école.",
    ],
  },
  {
    title: '5. Tarifs et paiement',
    body: [
      "Edukoo propose un essai gratuit de 30 jours sans engagement, puis trois plans annuels payants (Starter, School, Premium) en FCFA, détaillés sur la page d'accueil et dans Paramètres → Passer au plan payant. Le règlement s'effectue par Orange Money ou Moov Money, confirmé auprès de notre équipe par WhatsApp ; l'activation du plan est effectuée manuellement après réception du paiement.",
      "À l'expiration de l'essai gratuit sans souscription à un plan payant, l'accès au tableau de bord est suspendu jusqu'à activation d'un plan. Les données de l'école sont conservées et redeviennent accessibles dès l'activation.",
    ],
  },
  {
    title: '6. Disponibilité du service',
    body: [
      "Edukoo met en œuvre des moyens raisonnables pour assurer la disponibilité du service, sans pouvoir garantir une disponibilité continue à 100 % (maintenance, incidents techniques, dépendance à des prestataires d'hébergement tiers). Nous recommandons à chaque école d'exporter régulièrement ses données (Paramètres → Export & sauvegarde) à titre de sauvegarde personnelle.",
    ],
  },
  {
    title: '7. Propriété intellectuelle',
    body: [
      "Le logiciel Edukoo, son code, son design et sa marque restent la propriété exclusive de son éditeur. Les données saisies par votre établissement (élèves, notes, documents...) restent la propriété de votre établissement ; Edukoo ne s'octroie aucun droit de propriété sur ces données.",
    ],
  },
  {
    title: '8. Limitation de responsabilité',
    body: [
      "Edukoo ne peut être tenu responsable des conséquences d'une mauvaise utilisation du service par l'établissement (erreur de saisie, mauvaise gestion des accès), ni des interruptions dues à des causes hors de son contrôle raisonnable (panne d'un prestataire tiers, coupure réseau, force majeure).",
    ],
  },
  {
    title: '9. Résiliation',
    body: [
      "Votre établissement peut cesser d'utiliser Edukoo à tout moment. Edukoo se réserve le droit de suspendre un compte en cas d'usage manifestement frauduleux ou de non-paiement prolongé, après notification préalable lorsque cela est raisonnablement possible.",
    ],
  },
  {
    title: '10. Modifications',
    body: [
      "Ces conditions peuvent être mises à jour, notamment pour refléter de nouvelles fonctionnalités ou évolutions tarifaires. La date de dernière mise à jour figure en bas de page.",
    ],
  },
  {
    title: '11. Contact',
    body: [
      'Pour toute question sur ces conditions : WhatsApp +226 64 55 77 30 (du lundi au samedi, 8h–18h, heure de Ouagadougou).',
    ],
  },
]

export default function CguPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <section className="bg-gradient-to-b from-violet-50 to-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900">Conditions générales d&apos;utilisation</h1>
          <p className="text-lg text-gray-500 mt-4">Les règles d&apos;utilisation du logiciel Edukoo.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-bold text-gray-900 text-lg mb-3">{s.title}</h2>
              <div className="space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <p className="text-sm text-gray-400 pt-6 border-t border-gray-100">
            Dernière mise à jour : septembre 2026.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
