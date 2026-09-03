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

  const className = (student.classes as unknown as { name: string } | null)?.name ?? 'non affectée'
  const birthDateText = student.birth_date
    ? `né(e) le ${new Date(student.birth_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}, `
    : ''

  const buffer = await renderToBuffer(
    <CertificateDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        title: 'Certificat de scolarité',
        bodyLines: [
          `Je soussigné(e), Directeur/Directrice de ${school.name}, atteste que l’élève ${student.first_name} ${student.last_name}, ${birthDateText}est régulièrement inscrit(e) dans notre établissement en classe de ${className}${schoolYear ? ` durant l’année scolaire ${schoolYear.name}` : ''}.`,
          `Le présent certificat est délivré à l’intéressé(e) pour servir et valoir ce que de droit.`,
        ],
        issuedAt: new Date().toISOString(),
        directorName: school.director_name,
      }}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificat-scolarite-${student.first_name}-${student.last_name}.pdf"`,
    },
  })
}
