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

  if (!schoolYear) {
    return NextResponse.json({ error: dict.errors.noActiveSchoolYear }, { status: 400 })
  }

  const className = (student.classes as unknown as { name: string } | null)?.name ?? t.classUnassigned

  const buffer = await renderToBuffer(
    <CertificateDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        title: t.graduationCertTitle,
        bodyLines: [
          t.graduationBody1Template
            .replace('{school}', school.name)
            .replace('{student}', `${student.first_name} ${student.last_name}`)
            .replace('{class}', className)
            .replace('{year}', schoolYear.name),
          t.graduationBody2,
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
