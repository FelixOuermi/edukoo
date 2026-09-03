import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'

function formatDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export async function GET() {
  const { school } = await requireDirector()
  const supabase = await createClient()
  const t = getDictionary().excelExport.fullExport

  const [
    { data: students },
    { data: classes },
    { data: subjects },
    { data: teachers },
    { data: gradeTypes },
    { data: grades },
    { data: absences },
    { data: payments },
    { data: schoolYears },
  ] = await Promise.all([
    supabase.from('students').select('*, classes(name)').eq('school_id', school.id).order('last_name'),
    supabase.from('classes').select('*').eq('school_id', school.id).order('name'),
    supabase.from('subjects').select('*').eq('school_id', school.id).order('name'),
    supabase.from('teachers').select('name, phone, email, role, is_active').eq('school_id', school.id).order('name'),
    supabase.from('grade_types').select('name, weight').eq('school_id', school.id).order('created_at'),
    supabase
      .from('grades')
      .select('score, max_score, trimester, students(first_name, last_name, registration_number), subjects(name), grade_types(name), school_years(name)')
      .eq('school_id', school.id),
    supabase
      .from('absences')
      .select('absence_date, is_justified, students(first_name, last_name), classes(name)')
      .eq('school_id', school.id)
      .order('absence_date', { ascending: false }),
    supabase
      .from('fee_payments')
      .select('receipt_number, amount, installment_number, payment_method, paid_at, students(first_name, last_name)')
      .eq('school_id', school.id)
      .order('paid_at', { ascending: false }),
    supabase.from('school_years').select('*').eq('school_id', school.id).order('start_date', { ascending: false }),
  ])

  const workbook = XLSX.utils.book_new()

  const studentsSheet = (students ?? []).map((s) => ({
    [t.registrationHeader]: s.registration_number,
    [t.firstNameHeader]: s.first_name,
    [t.lastNameHeader]: s.last_name,
    [t.classHeader]: (s.classes as unknown as { name: string } | null)?.name ?? '',
    [t.birthDateHeader]: formatDate(s.birth_date),
    [t.statusHeader]: s.status,
    [t.parentNameHeader]: s.parent_name,
    [t.parentPhoneHeader]: s.parent_phone,
    [t.parentWhatsappHeader]: s.parent_whatsapp,
    [t.parentEmailHeader]: s.parent_email,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentsSheet), t.sheetStudents)

  const classesSheet = (classes ?? []).map((c) => ({
    [t.nameHeader]: c.name,
    [t.levelHeader]: c.level,
    [t.maxStudentsHeader]: c.max_students,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classesSheet), t.sheetClasses)

  const subjectsSheet = (subjects ?? []).map((s) => ({ [t.nameHeader]: s.name, [t.coefficientHeader]: s.coefficient }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subjectsSheet), t.sheetSubjects)

  const teachersSheet = (teachers ?? []).map((tc) => ({
    [t.nameHeader]: tc.name,
    [t.phoneHeader]: tc.phone,
    [t.emailHeader]: tc.email,
    [t.roleHeader]: tc.role === 'director' ? t.roleDirector : t.roleTeacher,
    [t.statusHeader]: tc.is_active ? t.statusActive : t.statusInactive,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(teachersSheet), t.sheetTeachers)

  const gradeTypesSheet = (gradeTypes ?? []).map((gt) => ({ [t.nameHeader]: gt.name, [t.weightHeader]: gt.weight }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gradeTypesSheet), t.sheetGradeTypes)

  const gradesSheet = (grades ?? []).map((g) => {
    const student = g.students as unknown as { first_name: string; last_name: string; registration_number: string | null } | null
    return {
      [t.registrationHeader]: student?.registration_number,
      [t.studentHeader]: student ? `${student.first_name} ${student.last_name}` : '',
      [t.subjectHeader]: (g.subjects as unknown as { name: string } | null)?.name ?? '',
      [t.gradeTypeHeader]: (g.grade_types as unknown as { name: string } | null)?.name ?? '',
      [t.schoolYearHeader]: (g.school_years as unknown as { name: string } | null)?.name ?? '',
      [t.trimesterHeader]: g.trimester,
      [t.scoreHeader]: g.score,
      [t.maxScoreHeader]: g.max_score,
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gradesSheet), t.sheetGrades)

  const absencesSheet = (absences ?? []).map((a) => {
    const student = a.students as unknown as { first_name: string; last_name: string } | null
    return {
      [t.studentHeader]: student ? `${student.first_name} ${student.last_name}` : '',
      [t.classHeader]: (a.classes as unknown as { name: string } | null)?.name ?? '',
      [t.dateHeader]: formatDate(a.absence_date),
      [t.justifiedHeader]: a.is_justified ? t.yes : t.no,
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(absencesSheet), t.sheetAbsences)

  const paymentsSheet = (payments ?? []).map((p) => {
    const student = p.students as unknown as { first_name: string; last_name: string } | null
    return {
      [t.receiptHeader]: p.receipt_number,
      [t.studentHeader]: student ? `${student.first_name} ${student.last_name}` : '',
      [t.installmentHeader]: p.installment_number,
      [t.amountHeader]: Number(p.amount),
      [t.modeHeader]: p.payment_method,
      [t.dateHeader]: formatDate(p.paid_at),
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentsSheet), t.sheetPayments)

  const yearsSheet = (schoolYears ?? []).map((y) => ({
    [t.nameHeader]: y.name,
    [t.startHeader]: formatDate(y.start_date),
    [t.endHeader]: formatDate(y.end_date),
    [t.activeHeader]: y.is_current ? t.yes : t.no,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yearsSheet), t.sheetSchoolYears)

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `edukoo-export-${school.name.replace(/[^a-z0-9]+/gi, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
