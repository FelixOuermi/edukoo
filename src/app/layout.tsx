import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Edukoo — Logiciel de gestion scolaire en Afrique francophone",
    template: "%s | Edukoo",
  },
  description:
    "Edukoo simplifie la gestion de votre école privée : inscriptions, paiements en FCFA, bulletins automatiques, absences et alertes WhatsApp parents. Essai gratuit 30 jours.",
  keywords: [
    "logiciel gestion école Burkina Faso",
    "logiciel scolaire Afrique francophone",
    "gestion école privée FCFA",
    "bulletin scolaire automatique",
    "suivi scolarité Ouagadougou",
    "logiciel université privée Burkina",
    "gestion élèves Afrique",
    "paiement scolarité Orange Money",
    "logiciel école Côte Ivoire Sénégal",
    "inscription scolaire logiciel",
  ],
  authors: [{ name: "Edukoo" }],
  creator: "Edukoo",
  publisher: "Edukoo",
  openGraph: {
    title: "Edukoo — Gérez votre école en Afrique francophone",
    description:
      "Bulletins en 1 clic, suivi des impayés, alertes WhatsApp parents. Logiciel scolaire en FCFA.",
    url: "https://edukoo.vercel.app",
    siteName: "Edukoo",
    locale: "fr_BF",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edukoo — Gestion scolaire pour l'Afrique",
    description:
      "Gérez votre école privée simplement : élèves, paiements, bulletins, absences.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://edukoo.vercel.app",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Edukoo",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web",
  description:
    "Logiciel de gestion scolaire pour établissements privés en Afrique francophone",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "75000",
      priceCurrency: "XOF",
      description: "Jusqu'à 150 élèves",
    },
    {
      "@type": "Offer",
      name: "School",
      price: "200000",
      priceCurrency: "XOF",
      description: "Jusqu'à 500 élèves",
    },
    {
      "@type": "Offer",
      name: "Premium",
      price: "400000",
      priceCurrency: "XOF",
      description: "Élèves illimités",
    },
  ],
  availableLanguage: "French",
  areaServed: [
    "Burkina Faso",
    "Côte d'Ivoire",
    "Sénégal",
    "Mali",
    "Niger",
    "Bénin",
    "Togo",
  ],
  featureList: [
    "Gestion des inscriptions élèves",
    "Suivi paiements scolarité FCFA",
    "Génération bulletins PDF automatique",
    "Suivi absences avec alertes WhatsApp",
    "Import élèves depuis Excel",
    "Paiement Orange Money et Moov Money",
    "Tableau de bord impayés temps réel",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
