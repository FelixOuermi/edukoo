import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/marketing-header'
import { MarketingFooter } from '@/components/marketing-footer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: "Comment Edukoo collecte, utilise et protège les données de votre école, de votre personnel, de vos élèves et de leurs parents.",
}

const SECTIONS = [
  {
    title: '1. Qui est responsable de vos données ?',
    body: [
      "Edukoo est un logiciel édité pour la gestion administrative d'écoles privées en Afrique francophone. Pour les données de votre école (comptes du personnel, élèves, parents, notes, absences, paiements), c'est votre établissement scolaire qui agit en tant que responsable du traitement : c'est lui qui décide quelles données saisir et pourquoi. Edukoo agit comme sous-traitant technique : nous fournissons l'outil, hébergeons les données de façon sécurisée et cloisonnée, et ne les utilisons que pour faire fonctionner le service — jamais pour nos propres finalités commerciales.",
      'Pour les données liées à votre compte école lui-même (facturation, contact), Edukoo est responsable du traitement.',
    ],
  },
  {
    title: '2. Quelles données sont collectées',
    body: [
      'Compte personnel (directeur, enseignant) : nom, email, téléphone, rôle.',
      'Élèves : prénom, nom, date de naissance, classe, statut, matricule, notes, absences, dossier disciplinaire, documents administratifs générés (bulletins, certificats).',
      'Parents/tuteurs : nom, téléphone, WhatsApp, email, lien avec le ou les élèves.',
      "Scolarité : montants dus, paiements enregistrés (espèces, Orange Money, Moov Money) et reçus. Edukoo n'a accès à aucune donnée bancaire ou numéro de carte : les paiements sont effectués en dehors de l'application, puis simplement enregistrés par l'école.",
      "Usage technique minimal : préférences d'affichage (ex. repli d'une checklist) stockées localement dans votre navigateur, pas de cookie publicitaire ni de traceur tiers.",
    ],
  },
  {
    title: '3. Pourquoi ces données sont-elles traitées',
    body: [
      "Uniquement pour permettre à votre école de gérer ses inscriptions, sa vie scolaire, ses bulletins, sa scolarité et sa communication avec les parents. Edukoo ne revend, ne loue et ne partage aucune donnée à des tiers à des fins commerciales ou publicitaires.",
    ],
  },
  {
    title: '4. Qui peut voir ces données',
    body: [
      "Le cloisonnement entre écoles est appliqué au niveau de la base de données elle-même (Row Level Security) : une école ne peut techniquement pas accéder aux données d'une autre école, même par erreur applicative.",
      "Au sein d'une même école : le directeur voit toutes les données de son établissement ; un enseignant ne voit que les classes et matières qui lui sont affectées ; un parent ne voit que les données de son ou ses propres enfants ; un élève ne voit que ses propres données.",
      'Prestataires techniques utilisés pour faire fonctionner le service : hébergement de la base de données et de l\'authentification (Supabase), hébergement de l\'application (Vercel), envoi d\'emails transactionnels (Resend). Ces prestataires n\'ont accès aux données que dans la mesure nécessaire à la fourniture technique du service et n\'en font aucun usage propre.',
    ],
  },
  {
    title: '5. Combien de temps ces données sont conservées',
    body: [
      "Les données sont conservées tant que le compte de l'école est actif. En cas de résiliation, votre école peut exporter l'intégralité de ses données (élèves, notes, absences, paiements...) au format Excel depuis Paramètres avant fermeture du compte. Passé un délai raisonnable après résiliation, les données sont supprimées, sauf obligation légale de conservation plus longue (ex. registres scolaires).",
    ],
  },
  {
    title: '6. Sécurité',
    body: [
      "Les mots de passe ne sont jamais stockés en clair (gestion déléguée à Supabase Auth, standard du secteur). Les connexions au site sont chiffrées (HTTPS). L'isolation entre écoles est appliquée par la base de données elle-même, pas seulement par le code applicatif, ce qui limite le risque d'erreur.",
    ],
  },
  {
    title: '7. Le cas particulier des données des élèves mineurs',
    body: [
      "La majorité des élèves inscrits sur Edukoo sont mineurs. C'est votre établissement scolaire, en tant que responsable du traitement, qui doit s'assurer d'avoir une base légale (mission d'enseignement, information des familles) pour traiter ces données. Edukoo limite techniquement l'accès aux seules personnes autorisées (personnel de l'école, parents/tuteurs liés, élève lui-même) et ne communique jamais ces données à des tiers.",
    ],
  },
  {
    title: '8. Vos droits',
    body: [
      "Toute personne dont les données sont traitées (membre du personnel, parent, élève) peut demander à accéder à ses données, les faire rectifier, ou en demander la suppression. Pour un élève ou un parent, cette demande doit d'abord être adressée à l'établissement scolaire concerné, qui reste responsable du traitement de ces données. Pour toute question sur le traitement technique effectué par Edukoo, vous pouvez nous contacter directement (coordonnées ci-dessous).",
    ],
  },
  {
    title: '9. Cadre légal',
    body: [
      "Edukoo s'efforce de respecter les principes de protection des données personnelles applicables dans les pays où le service est utilisé, notamment la loi burkinabè n°010-2004/AN portant protection des données à caractère personnel. Cette politique sera mise à jour si nécessaire pour refléter les obligations applicables dans chaque pays desservi.",
    ],
  },
  {
    title: '10. Modifications de cette politique',
    body: [
      "Cette politique peut évoluer, notamment pour refléter de nouvelles fonctionnalités ou obligations légales. La date de dernière mise à jour figure en bas de page. En cas de changement important, les directeurs d'école en seront informés.",
    ],
  },
  {
    title: '11. Contact',
    body: [
      'Pour toute question sur cette politique ou sur vos données : WhatsApp +226 64 55 77 30 (du lundi au samedi, 8h–18h, heure de Ouagadougou).',
    ],
  },
]

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <section className="bg-gradient-to-b from-violet-50 to-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900">Politique de confidentialité</h1>
          <p className="text-lg text-gray-500 mt-4">
            Comment nous traitons les données de votre école, de votre personnel, de vos élèves et de leurs
            parents.
          </p>
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
