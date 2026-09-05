import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing-header'
import { MarketingFooter } from '@/components/marketing-footer'

export const metadata: Metadata = {
  title: 'FAQ — Questions fréquentes',
  description:
    'Toutes les réponses sur Edukoo, le logiciel de gestion scolaire pour écoles privées en Afrique francophone.',
}

const FAQS = [
  {
    question: "Qu'est-ce qu'Edukoo ?",
    answer:
      "Edukoo est un logiciel de gestion scolaire en ligne conçu spécifiquement pour les écoles primaires, collèges et lycées privés d'Afrique francophone. Il permet de gérer les inscriptions, les paiements de scolarité en FCFA, les bulletins et les absences depuis n'importe quel appareil connecté à internet.",
  },
  {
    question: 'Edukoo fonctionne-t-il au Burkina Faso ?',
    answer:
      "Oui, Edukoo est conçu en priorité pour le marché burkinabè. Tous les montants sont en FCFA, les paiements supportent Orange Money et Moov Money, et l'interface est disponible en français. Nous avons également des clients en Côte d'Ivoire, au Sénégal et au Mali.",
  },
  {
    question: 'Comment générer les bulletins scolaires avec Edukoo ?',
    answer:
      "Avec Edukoo, vous saisissez les notes de chaque élève par matière et par trimestre. Le logiciel calcule automatiquement les moyennes, le rang et la mention. En un seul clic, vous générez les bulletins PDF de toute une classe, prêts à imprimer ou à envoyer aux parents.",
  },
  {
    question: 'Comment suivre les paiements de scolarité ?',
    answer:
      "Edukoo vous permet d'enregistrer chaque paiement de scolarité (espèces, Orange Money, Moov Money) et génère automatiquement un reçu numéroté. Le tableau de bord vous montre en temps réel le taux de recouvrement et la liste des élèves en retard de paiement.",
  },
  {
    question: 'Edukoo supporte-t-il Orange Money et Moov Money ?',
    answer:
      "Oui, mais pas comme une caisse en ligne : le parent règle par Orange Money, Moov Money ou en espèces en dehors de l'application, et le personnel de l'école enregistre ensuite ce paiement dans Edukoo, qui génère le reçu. Votre numéro Mobile Money apparaît sur les reçus et dans vos communications avec les parents, facilitant les règlements à distance.",
  },
  {
    question: "Comment notifier les parents d'une absence ?",
    answer:
      "Lorsque vous marquez un élève absent, Edukoo génère automatiquement un lien WhatsApp pré-rempli vers le parent. En un clic, vous envoyez le message : votre enfant a été absent aujourd'hui. Le système enregistre si le parent a été notifié et si l'absence est justifiée.",
  },
  {
    question: 'Peut-on importer les élèves depuis Excel ?',
    answer:
      'Oui. Si vous avez déjà une liste d\'élèves dans un fichier Excel, Edukoo peut l\'importer directement. Cela évite de ressaisir des centaines d\'élèves manuellement lors de la migration vers Edukoo.',
  },
  {
    question: "Quel est le prix d'Edukoo ?",
    answer:
      'Edukoo propose trois plans annuels en FCFA : Starter à 75 000 FCFA/an pour les petites écoles jusqu\'à 150 élèves, School à 200 000 FCFA/an jusqu\'à 500 élèves, et Premium à 400 000 FCFA/an pour un nombre illimité d\'élèves. Un essai gratuit de 30 jours est disponible sans carte bancaire.',
  },
  {
    question: 'Edukoo fonctionne-t-il pour les universités ?',
    answer:
      "Non, pas pour l'instant. Edukoo est pensé pour le secondaire : écoles primaires, collèges et lycées privés. La gestion universitaire (crédits ECTS, unités d'enseignement, jurys de délibération) n'est pas au programme.",
  },
  {
    question: 'Comment générer les bulletins de toute une classe en 1 clic ?',
    answer:
      'Dans le module Bulletins, sélectionnez une classe et un trimestre. Edukoo affiche toutes les moyennes calculées automatiquement. Cliquez sur Générer tous les bulletins pour obtenir un PDF professionnel pour chaque élève de la classe en quelques secondes.',
  },
  {
    question: 'Edukoo nécessite-t-il une installation ?',
    answer:
      'Non. Edukoo est un logiciel en ligne (SaaS). Vous y accédez depuis votre navigateur web sur ordinateur, tablette ou smartphone. Aucune installation n\'est nécessaire et les mises à jour sont automatiques.',
  },
  {
    question: 'Comment contacter le support Edukoo ?',
    answer:
      'Notre support est disponible par WhatsApp du lundi au samedi de 8h à 18h (heure de Ouagadougou). Nous répondons généralement dans l\'heure pendant les heures ouvrables.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <MarketingHeader />

      <section className="bg-gradient-to-b from-violet-50 to-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900">Questions fréquentes</h1>
          <p className="text-lg text-gray-500 mt-4">
            Tout ce qu&apos;il faut savoir sur Edukoo, le logiciel de gestion scolaire pensé pour
            l&apos;Afrique francophone.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {FAQS.map((f) => (
            <div key={f.question} className="border-b border-gray-100 pb-8 last:border-0">
              <h2 className="font-bold text-gray-900 text-lg">{f.question}</h2>
              <p className="text-gray-500 mt-2 leading-relaxed">{f.answer}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white font-medium px-7 py-3.5 rounded-lg text-base transition-colors shadow-lg shadow-violet-200"
          >
            Essai gratuit 30 jours
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
