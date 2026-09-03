import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'
import { requireDirector } from '@/lib/school'
import { computeSchoolStatistics } from '@/lib/statistics'
import { getDictionary } from '@/lib/i18n'

export async function GET(request: Request) {
  const { school, schoolYear } = await requireDirector()
  const dict = getDictionary()
  const t = dict.excelExport.statistics

  if (!schoolYear) {
    return NextResponse.json({ error: dict.errors.noActiveSchoolYear }, { status: 400 })
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
    { [t.indicatorHeader]: t.schoolAverageLabel, [t.valueHeader]: schoolAverage !== null ? schoolAverage.toFixed(2) : '' },
    { [t.indicatorHeader]: t.successRateLabel, [t.valueHeader]: schoolSuccessRate !== null ? schoolSuccessRate.toFixed(1) : '' },
  ]
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summarySheet), t.sheetSummary)

  const classSheet = classStats.map((c) => ({
    [t.classHeader]: c.className,
    [t.headcountHeader]: c.studentCount,
    [t.gradedCountHeader]: c.gradedCount,
    [t.averageHeader]: c.average !== null ? Number(c.average.toFixed(2)) : '',
    [t.successRatePctHeader]: c.successRate !== null ? Number(c.successRate.toFixed(1)) : '',
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classSheet), t.sheetClassComparison)

  const subjectSheet = subjectStats.map((s) => ({
    [t.subjectHeader]: s.subjectName,
    [t.averageHeader]: Number(s.average.toFixed(2)),
    [t.gradeCountHeader]: s.count,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subjectSheet), t.sheetSubjectAverages)

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `edukoo-statistiques-${school.name.replace(/[^a-z0-9]+/gi, '-')}-T${trimester}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
