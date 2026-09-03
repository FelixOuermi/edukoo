import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentStudent } from '@/lib/portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeClassBulletins } from '@/lib/bulletin'
import { BulletinDocument } from '@/lib/pdf/bulletin-document'

export async function GET(request: Request) {
  const { student, school, schoolYear } = await getCurrentStudent()

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }
  if (!student.class_id) {
    return NextResponse.json({ error: 'Aucune classe assignée.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const trimester = Number(searchParams.get('trimestre') || 1)

  // Client admin : nécessaire pour calculer le rang sur la classe entière
  // (un élève ne voit par RLS que son propre dossier). getCurrentStudent()
  // a déjà résolu `student` depuis la session de l'élève, donc class_id
  // est garanti être le sien.
  const admin = createAdminClient()

  const { bulletins } = await computeClassBulletins({
    schoolId: school.id,
    classId: student.class_id,
    schoolYearId: schoolYear.id,
    trimester,
    supabase: admin,
  })

  const bulletin = bulletins.find((b) => b.studentId === student.id)
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
