import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { getCurrentParent, requireOwnChild } from '@/lib/portal'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeClassBulletins } from '@/lib/bulletin'
import { BulletinDocument } from '@/lib/pdf/bulletin-document'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params
  const { parent, school, schoolYear } = await getCurrentParent()

  // Autorisation vérifiée via RLS (le lien parent_students n'est visible
  // que pour ses propres enfants) avant tout accès admin ci-dessous.
  const owns = await requireOwnChild(parent.id, studentId)
  if (!owns) return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 })

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const trimester = Number(searchParams.get('trimestre') || 1)

  // Client admin : nécessaire pour calculer le rang sur la classe entière
  // (un parent ne voit par RLS que son propre enfant). L'autorisation a
  // déjà été vérifiée ci-dessus, avant tout appel avec ce client.
  const admin = createAdminClient()

  const { data: student } = await admin
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
    supabase: admin,
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
