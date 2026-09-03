import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { ConvocationDocument } from '@/lib/pdf/convocation-document'
import { getDictionary } from '@/lib/i18n'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const dict = getDictionary()
  const t = dict.documents.convocation

  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, parent_name, classes(name)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!student) {
    return NextResponse.json({ error: dict.errors.studentNotFound }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const subject = searchParams.get('subject')?.trim() || t.title
  const meetingDate = searchParams.get('meetingDate')
  const meetingTime = searchParams.get('meetingTime')?.trim() || null
  const place = searchParams.get('place')?.trim() || null
  const message = searchParams.get('message')?.trim() || ''

  if (!meetingDate) {
    return NextResponse.json({ error: dict.errors.meetingDateRequired }, { status: 400 })
  }

  const className = (student.classes as unknown as { name: string } | null)?.name ?? null
  const recipientName =
    student.parent_name || t.defaultParentsTemplate.replace('{name}', `${student.first_name} ${student.last_name}`)

  const buffer = await renderToBuffer(
    <ConvocationDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        recipientName,
        studentName: `${student.first_name} ${student.last_name}`,
        className,
        subject,
        meetingDate,
        meetingTime,
        place,
        message,
        issuedAt: new Date().toISOString(),
        directorName: school.director_name,
      }}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="convocation-${student.first_name}-${student.last_name}.pdf"`,
    },
  })
}
