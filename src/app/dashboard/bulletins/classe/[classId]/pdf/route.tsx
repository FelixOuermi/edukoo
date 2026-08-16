import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentSchool } from '@/lib/school'
import { computeClassBulletins } from '@/lib/bulletin'
import { BulletinsBatchDocument, type BulletinPdfData } from '@/lib/pdf/bulletin-document'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const { classId } = await params
  const { school, schoolYear } = await getCurrentSchool()

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const trimester = Number(searchParams.get('trimestre') || 1)

  const { bulletins } = await computeClassBulletins({
    schoolId: school.id,
    classId,
    schoolYearId: schoolYear.id,
    trimester,
  })

  if (bulletins.length === 0) {
    return NextResponse.json({ error: 'Aucun élève dans cette classe.' }, { status: 404 })
  }

  const data: BulletinPdfData[] = bulletins.map((bulletin) => ({
    schoolName: school.name,
    schoolAddress: school.address,
    schoolYearName: schoolYear.name,
    trimester,
    bulletin,
  }))

  const buffer = await renderToBuffer(<BulletinsBatchDocument data={data} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bulletins-classe-${classId}.pdf"`,
    },
  })
}
