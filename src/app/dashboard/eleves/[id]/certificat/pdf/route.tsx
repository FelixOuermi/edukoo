import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { CertificateDocument } from '@/lib/pdf/certificate-document'
import { getDictionary } from '@/lib/i18n'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.documents.certificate

  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, birth_date, classes(name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!student) {
    return NextResponse.json({ error: dict.errors.studentNotFound }, { status: 404 })
  }

  const className = (student.classes as unknown as { name: string } | null)?.name ?? t.classUnassigned
  const birthDateText = student.birth_date
    ? t.bornOnTemplate.replace(
        '{date}',
        new Date(student.birth_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      )
    : ''

  const buffer = await renderToBuffer(
    <CertificateDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        title: t.schoolCertTitle,
        bodyLines: [
          t.schoolCertBody1Template
            .replace('{school}', school.name)
            .replace('{student}', `${student.first_name} ${student.last_name}`)
            .replace('{birthDate}', birthDateText)
            .replace('{class}', className)
            .replace('{yearSuffix}', schoolYear ? t.schoolYearSuffixTemplate.replace('{year}', schoolYear.name) : ''),
          t.schoolCertBody2,
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
