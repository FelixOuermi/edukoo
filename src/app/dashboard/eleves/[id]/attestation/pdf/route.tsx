import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { CertificateDocument } from '@/lib/pdf/certificate-document'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, birth_date, classes(name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 })
  }

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }

  const className = (student.classes as unknown as { name: string } | null)?.name ?? 'non affectée'

  const buffer = await renderToBuffer(
    <CertificateDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        title: 'Attestation de réussite',
        bodyLines: [
          `Je soussigné(e), Directeur/Directrice de ${school.name}, atteste que l’élève ${student.first_name} ${student.last_name} a été régulièrement inscrit(e) et a suivi avec assiduité les cours de la classe de ${className} durant l’année scolaire ${schoolYear.name}.`,
          `L’intéressé(e) a satisfait aux exigences de fin d’année et est autorisé(e) à poursuivre sa scolarité dans la classe supérieure.`,
        ],
        issuedAt: new Date().toISOString(),
        directorName: school.director_name,
      }}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="attestation-reussite-${student.first_name}-${student.last_name}.pdf"`,
    },
  })
}
