import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/marketing-header'
import { MarketingFooter } from '@/components/marketing-footer'

export const metadata: Metadata = {
  title: "Guide d'utilisation",
  description: "Le guide complet pour prendre en main Edukoo : configuration initiale, élèves, notes, absences, scolarité, communication et documents.",
}

const SECTIONS = [
  {
    id: 'demarrage',
    title: '1. Démarrage — les 3 étapes indispensables',
    body: [
      "Avant toute chose, activez une année scolaire : Paramètres → Années scolaires → renseignez un nom (ex. 2026-2027) et des dates, puis validez. Cette action l'active automatiquement — c'est le préalable à presque tout le reste (notes, emploi du temps, grille tarifaire, services optionnels).",
      "Créez ensuite vos classes (Classes & Matières → Ajouter une classe) et vos matières, avec leurs coefficients.",
      "Inscrivez vos élèves (Élèves → Inscrire un élève), soit un par un, soit en une fois si vous avez déjà un fichier Excel (bouton Importer Excel sur la page Notes, ou depuis la liste des élèves).",
      "Une checklist de prise en main apparaît sur votre tableau de bord tant que ces étapes (et quelques autres) ne sont pas terminées — elle coche automatiquement au fur et à mesure.",
    ],
  },
  {
    id: 'eleves',
    title: '2. Élèves et classes',
    body: [
      "Chaque élève a un statut : actif, suspendu ou parti. Un élève 'parti' reste dans l'historique (bulletins, paiements passés) mais sort des listes actives et des calculs de recouvrement.",
      "Le matricule est généré automatiquement à l'inscription, pas besoin de le saisir.",
      "Pour modifier la fiche d'un élève (nom, classe, statut, coordonnées du parent) après son inscription : Élèves → cliquez sur son nom → Modifier. Un changement de classe ou de statut est tracé dans le journal d'audit.",
    ],
  },
  {
    id: 'modele-scolaire',
    title: '3. Cycles et niveaux',
    body: [
      "Chaque classe peut être rattachée à un niveau (ex. 6ème, 2nde C) lui-même rattaché à un cycle (post-primaire, secondaire général, secondaire technique/pro). Ce référentiel est propre à votre école et se configure depuis Classes & Matières.",
      "Une école nouvellement créée reçoit un référentiel de départ conforme au système burkinabè : post-primaire (6e à 3e) et secondaire général (2nde à Tle, avec séries A/C/D) déjà créés. Le cycle technique/pro est laissé vide à créer vous-même, ses filières étant trop spécifiques à chaque lycée pour un modèle unique.",
      "Vous pouvez ajouter ou supprimer un cycle ou un niveau à tout moment (un niveau ne peut être supprimé que si aucune classe n'y est encore rattachée), et rattacher une classe existante à un niveau depuis sa fiche.",
    ],
  },
  {
    id: 'notes',
    title: '4. Notes et bulletins',
    body: [
      "Notes (saisie) et Bulletins (consultation, impression) sont deux pages distinctes du menu.",
      "Configurez d'abord vos types de notes (Classes & Matières → Types de notes) : devoir, composition... chacun avec un poids qui détermine son importance dans la moyenne.",
      "Un enseignant ne voit et ne saisit des notes que pour les classes/matières qui lui sont affectées (Enseignants → Affecter classes & matières). Le directeur voit et saisit partout.",
      "Sur la page Notes, choisissez classe + matière + trimestre, saisissez, puis Sauvegarder. Les notes sont strictement comprises entre 0 et 20 : si une valeur saisie est hors barème, l'enregistrement entier est refusé avec le détail de la ou des valeurs à corriger, plutôt que d'enregistrer une partie seulement. Import Excel disponible pour saisir en masse (colonnes : Matricule ou Nom+Prénom, puis une colonne par type de note).",
      "Une colonne « Appréciation (matière) » sur la page Notes permet à l'enseignant de la matière de laisser un commentaire par élève pour le trimestre en cours ; elle apparaît ensuite sur le bulletin PDF, sous la ligne de la matière concernée. L'appréciation générale du bulletin (une par élève, tous trimestres confondus) reste éditable sur la page Bulletins.",
      "Les bulletins calculent automatiquement moyennes, rang (avec le nombre total d'élèves classés, ex. « 8/24 ») et mention, et se génèrent en PDF pour un élève ou toute une classe en un clic.",
    ],
  },
  {
    id: 'absences',
    title: '5. Absences',
    body: [
      "Sur la page Absences, sélectionnez une classe puis cochez les élèves absents du jour. Un lien WhatsApp pré-rempli permet de notifier chaque parent en un clic.",
      "Un parent peut soumettre un motif de justification depuis son portail ; le directeur ou l'enseignant concerné le valide ou le refuse depuis la fiche de l'élève.",
      "Un seuil d'alerte (Paramètres, par défaut 4 absences/mois) déclenche automatiquement un email au parent et une entrée dans le journal d'audit au-delà de ce seuil.",
    ],
  },
  {
    id: 'a-risque',
    title: '6. Élèves à surveiller',
    body: [
      "Edukoo signale automatiquement un élève dès qu'il cumule un ou plusieurs facteurs de risque sur la période en cours : chute de moyenne d'au moins 2 points par rapport au trimestre précédent, moyenne générale sous 8/20, absences non justifiées au-dessus du seuil d'alerte de l'école, ou sanction disciplinaire enregistrée.",
      "Cette liste est volontairement simple et explicable (un score = le nombre de facteurs déclenchés, sans pondération savante) plutôt qu'un modèle qu'il faudrait faire confiance les yeux fermés.",
      "Visible pour le directeur dans Statistiques (table triée par score, toutes classes) et pour tout le personnel sur la fiche d'un élève concerné (encart rouge avec le détail des facteurs), avec un bouton « Expliquer avec l'IA » pour obtenir une phrase de synthèse en langage clair.",
    ],
  },
  {
    id: 'ia',
    title: '7. Synthèses par intelligence artificielle',
    body: [
      "Sur la page Statistiques, le bouton « Générer une synthèse (IA) » produit un résumé en 3 à 5 phrases de la performance d'une classe ou de l'école sur la période, à partir des mêmes chiffres déjà affichés (moyennes, taux de réussite). Génération uniquement à la demande (un clic), jamais automatique en fond.",
      "Un nombre limité de générations par jour s'applique selon votre plan, pour maîtriser les coûts : 3/jour en essai gratuit, 5/jour en plan Starter, 15/jour en plan École, 30/jour en plan Premium. Le compteur repart à zéro chaque jour.",
    ],
  },
  {
    id: 'discipline',
    title: '8. Vie scolaire et discipline',
    body: [
      "Depuis la fiche d'un élève, le personnel peut enregistrer une observation, un avertissement, une retenue ou une exclusion. Visible en lecture seule par le parent et l'élève sur leur portail.",
    ],
  },
  {
    id: 'emploi-du-temps',
    title: '9. Emploi du temps',
    body: [
      "Le directeur crée les créneaux par classe (Emploi du temps → Ajouter un créneau). Une détection de conflit empêche de programmer deux fois la même classe, le même enseignant ou la même salle sur un créneau qui se chevauche.",
      "Chaque enseignant voit automatiquement son propre planning ; les parents et élèves voient celui de leur classe sur leur portail.",
    ],
  },
  {
    id: 'cahier-de-texte',
    title: '10. Cahier de textes',
    body: [
      "Un enseignant ajoute une entrée (leçon du jour, devoir à faire) pour une classe/matière qui lui est affectée. Visible immédiatement par les parents et élèves de la classe concernée.",
    ],
  },
  {
    id: 'scolarite',
    title: '11. Scolarité et paiements',
    body: [
      "Définissez d'abord la grille tarifaire par classe (Paramètres → Grille tarifaire, une fois l'année scolaire active) : montant annuel et nombre de tranches.",
      "Pour enregistrer un paiement : Scolarité → Enregistrer un paiement → recherchez l'élève → montant, mode (espèces, Orange Money, Moov Money), date. Un reçu PDF numéroté est généré automatiquement.",
      "Important : Edukoo enregistre les paiements reçus, il ne collecte pas l'argent lui-même. Le parent règle par Orange Money/Moov Money ou en espèces en dehors de l'application ; le personnel de l'école enregistre ensuite ce paiement dans Edukoo.",
      "Le tableau de bord affiche en temps réel le taux de recouvrement et la liste des élèves en retard.",
    ],
  },
  {
    id: 'services',
    title: '12. Cantine et transport',
    body: [
      "Fonctionnement similaire à la scolarité mais par abonnement individuel : un élève y souscrit ou non, indépendamment de sa classe. Page Services → onglet Cantine ou Transport → Ajouter un abonnement.",
    ],
  },
  {
    id: 'salles',
    title: '13. Salles',
    body: [
      "Pour réserver une salle ponctuellement (réunion, conseil de classe...), distinct des créneaux récurrents de l'emploi du temps. Détection de conflit incluse.",
    ],
  },
  {
    id: 'communication',
    title: '14. Communication',
    body: [
      "Messagerie : un fil de discussion par élève, entre le personnel et les parents liés à cet élève, accessible depuis la fiche élève et le portail parent.",
      "Annonces : publiées par le directeur, visibles par tout le personnel, les parents et les élèves de l'école (page Annonces et accueil des portails).",
    ],
  },
  {
    id: 'portails',
    title: '15. Portails parent et élève',
    body: [
      "Depuis la fiche d'un élève, le personnel peut inviter un parent par email — un compte lui est créé automatiquement avec accès en lecture seule aux données de son ou ses enfants (notes, absences, bulletins, scolarité, discipline, messagerie).",
      "Un compte élève peut aussi être créé, avec le même principe de lecture seule sur son propre dossier.",
    ],
  },
  {
    id: 'documents',
    title: '16. Documents administratifs',
    body: [
      "Depuis la fiche d'un élève : certificat de scolarité, attestation de réussite (décision du directeur, pas de calcul automatique de passage), et convocation (réunion, conseil de discipline...) avec sujet, date, lieu et message libres. Tous générés en PDF avec le logo de l'école.",
    ],
  },
  {
    id: 'statistiques',
    title: '17. Statistiques',
    body: [
      "Réservé au directeur : moyenne générale de l'école, taux de réussite, comparatif inter-classes et moyennes par matière, avec export Excel, plus la liste des « Élèves à surveiller » et le bouton de synthèse par IA (voir sections dédiées ci-dessus).",
    ],
  },
  {
    id: 'equipe',
    title: '18. Équipe (enseignants)',
    body: [
      "Le directeur invite un membre du personnel par email (page Enseignants), lui attribue un rôle (directeur ou enseignant), puis lui affecte les classes/matières sur lesquelles il pourra saisir des notes et absences.",
      "Un enseignant peut être désactivé (accès coupé, historique conservé) plutôt que supprimé.",
    ],
  },
  {
    id: 'personnel-paie',
    title: '19. Personnel et paie',
    body: [
      "Module distinct de la page Enseignants, réservé au directeur, pour gérer la paie de tout le personnel de l'école — enseignant ou non (administratif, surveillance, entretien...).",
      "Ajoutez un membre du personnel avec son poste et son salaire mensuel, puis enregistrez chaque paiement de salaire effectué ; un reçu PDF numéroté est généré automatiquement, comme pour un paiement de scolarité.",
    ],
  },
  {
    id: 'parametres',
    title: '20. Paramètres',
    body: [
      "Informations de l'école (nom, adresse, contacts, numéros Mobile Money), logo (utilisé sur bulletins et reçus PDF), années scolaires, grille tarifaire, périodes (trimestres/semestres), seuil d'alerte absentéisme, et export complet des données au format Excel.",
    ],
  },
  {
    id: 'hors-ligne',
    title: '21. Fonctionnement hors connexion',
    body: [
      "Edukoo est installable comme une application (PWA) et reste consultable hors connexion : les pages déjà visitées restent accessibles en lecture seule si le réseau coupe, avec les dernières données vues (pas nécessairement les toutes dernières).",
      "La saisie de notes et d'absences va plus loin : si l'enregistrement échoue faute de réseau au moment de sauvegarder, la saisie est mise en attente sur l'appareil (un message et un bandeau l'indiquent) puis envoyée automatiquement dès que la connexion revient — pas besoin de resaisir. Si entre-temps quelqu'un d'autre a modifié la même donnée, la version la plus récente l'emporte et l'événement est tracé dans le journal d'audit.",
      "Les paiements ne bénéficient volontairement pas de ce mécanisme : le risque de double encaissement en cas de resynchronisation automatique est jugé trop élevé. Un paiement doit toujours être enregistré avec une connexion active.",
    ],
  },
  {
    id: 'abonnement',
    title: '22. Essai gratuit et abonnement',
    body: [
      "L'essai gratuit dure 30 jours à partir de la création du compte. Passé ce délai sans plan payant activé, l'accès au tableau de bord est suspendu (vos données restent intactes) jusqu'à activation d'un plan.",
      "Pour passer au payant : Paramètres → Passer au plan payant → choisissez un plan → réglez par Orange Money/Moov Money → confirmez sur WhatsApp. L'activation est faite par notre équipe après réception du paiement.",
    ],
  },
  {
    id: 'aide',
    title: '23. Besoin d\'aide ?',
    body: [
      'Notre support est disponible par WhatsApp au +226 64 55 77 30, du lundi au samedi de 8h à 18h (heure de Ouagadougou). Nous faisons de notre mieux pour répondre rapidement pendant les heures ouvrables.',
    ],
  },
]

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <section className="bg-gradient-to-b from-violet-50 to-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900">Guide d&apos;utilisation</h1>
          <p className="text-lg text-gray-500 mt-4">
            Tout ce qu&apos;il faut savoir pour prendre en main Edukoo, étape par étape.
          </p>
        </div>
      </section>

      <section className="py-10 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sommaire</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-[#7c3aed] hover:underline py-0.5">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-6 border-b border-gray-100 pb-10 last:border-0">
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
        </div>

        <div className="max-w-3xl mx-auto mt-4 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-[#7c3aed] font-medium hover:underline"
          >
            Voir aussi la FAQ →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
