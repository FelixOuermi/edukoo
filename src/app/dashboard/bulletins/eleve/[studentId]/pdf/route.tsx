import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { computeClassBulletins } from '@/lib/bulletin'
import { BulletinDocument } from '@/lib/pdf/bulletin-document'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params
  const { school, schoolYear } = await getCurrentSchool()
  const supabase = await createClient()

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const trimester = Number(searchParams.get('trimestre') || 1)

  const { data: student } = await supabase
    .from('students')
    .select('class_id')
    .eq('id', studentId)
    .eq('school_id', school.id)
    .single()

  if (!student?.class_id) {
    return NextResponse.json({ error: 'Élève ou classe introuvable.' }, { status: 404 })
  }

  const { bulletins } = await computeClassBulletins({
    schoolId: school.id,
    classId: student.class_id,
    schoolYearId: schoolYear.id,
    trimester,
  })

  const bulletin = bulletins.find((b) => b.studentId === studentId)
  if (!bulletin) {
    return NextResponse.json({ error: 'Bulletin introuvable.' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    <BulletinDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolLogoUrl: school.logo_url,
        schoolYearName: schoolYear.name,
        trimester,
        bulletin,
      }}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bulletin-${bulletin.studentName.replace(/\s+/g, '-')}.pdf"`,
    },
  })
}
