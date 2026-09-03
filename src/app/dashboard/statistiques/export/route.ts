import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'
import { requireDirector } from '@/lib/school'
import { computeSchoolStatistics } from '@/lib/statistics'

export async function GET(request: Request) {
  const { school, schoolYear } = await requireDirector()

  if (!schoolYear) {
    return NextResponse.json({ error: 'Aucune année scolaire active.' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const trimester = Number(searchParams.get('trimestre') || 1)

  const { classStats, subjectStats, schoolAverage, schoolSuccessRate } = await computeSchoolStatistics({
    schoolId: school.id,
    schoolYearId: schoolYear.id,
    trimester,
  })

  const workbook = XLSX.utils.book_new()

  const summarySheet = [
    { Indicateur: 'Moyenne générale de l’école', Valeur: schoolAverage !== null ? schoolAverage.toFixed(2) : '' },
    { Indicateur: 'Taux de réussite global (%)', Valeur: schoolSuccessRate !== null ? schoolSuccessRate.toFixed(1) : '' },
  ]
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summarySheet), 'Synthèse')

  const classSheet = classStats.map((c) => ({
    Classe: c.className,
    Effectif: c.studentCount,
    ElevesNotes: c.gradedCount,
    Moyenne: c.average !== null ? Number(c.average.toFixed(2)) : '',
    TauxReussitePct: c.successRate !== null ? Number(c.successRate.toFixed(1)) : '',
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classSheet), 'Comparatif classes')

  const subjectSheet = subjectStats.map((s) => ({
    Matiere: s.subjectName,
    Moyenne: Number(s.average.toFixed(2)),
    NombreDeNotes: s.count,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subjectSheet), 'Moyennes par matière')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `edukoo-statistiques-${school.name.replace(/[^a-z0-9]+/gi, '-')}-T${trimester}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
