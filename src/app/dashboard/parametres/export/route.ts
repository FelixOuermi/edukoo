import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'

function formatDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

export async function GET() {
  const { school } = await requireDirector()
  const supabase = await createClient()

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
    Matricule: s.registration_number,
    Prenom: s.first_name,
    Nom: s.last_name,
    Classe: (s.classes as unknown as { name: string } | null)?.name ?? '',
    DateNaissance: formatDate(s.birth_date),
    Statut: s.status,
    ParentNom: s.parent_name,
    ParentTelephone: s.parent_phone,
    ParentWhatsapp: s.parent_whatsapp,
    ParentEmail: s.parent_email,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(studentsSheet), 'Élèves')

  const classesSheet = (classes ?? []).map((c) => ({ Nom: c.name, Niveau: c.level, EffectifMax: c.max_students }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classesSheet), 'Classes')

  const subjectsSheet = (subjects ?? []).map((s) => ({ Nom: s.name, Coefficient: s.coefficient }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(subjectsSheet), 'Matières')

  const teachersSheet = (teachers ?? []).map((t) => ({
    Nom: t.name,
    Telephone: t.phone,
    Email: t.email,
    Role: t.role === 'director' ? 'Directeur' : 'Enseignant',
    Statut: t.is_active ? 'Actif' : 'Inactif',
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(teachersSheet), 'Enseignants')

  const gradeTypesSheet = (gradeTypes ?? []).map((gt) => ({ Nom: gt.name, Poids: gt.weight }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gradeTypesSheet), 'Types de notes')

  const gradesSheet = (grades ?? []).map((g) => {
    const student = g.students as unknown as { first_name: string; last_name: string; registration_number: string | null } | null
    return {
      Matricule: student?.registration_number,
      Eleve: student ? `${student.first_name} ${student.last_name}` : '',
      Matiere: (g.subjects as unknown as { name: string } | null)?.name ?? '',
      TypeNote: (g.grade_types as unknown as { name: string } | null)?.name ?? '',
      AnneeScolaire: (g.school_years as unknown as { name: string } | null)?.name ?? '',
      Trimestre: g.trimester,
      Note: g.score,
      Bareme: g.max_score,
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(gradesSheet), 'Notes')

  const absencesSheet = (absences ?? []).map((a) => {
    const student = a.students as unknown as { first_name: string; last_name: string } | null
    return {
      Eleve: student ? `${student.first_name} ${student.last_name}` : '',
      Classe: (a.classes as unknown as { name: string } | null)?.name ?? '',
      Date: formatDate(a.absence_date),
      Justifiee: a.is_justified ? 'Oui' : 'Non',
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(absencesSheet), 'Absences')

  const paymentsSheet = (payments ?? []).map((p) => {
    const student = p.students as unknown as { first_name: string; last_name: string } | null
    return {
      Recu: p.receipt_number,
      Eleve: student ? `${student.first_name} ${student.last_name}` : '',
      Tranche: p.installment_number,
      Montant: Number(p.amount),
      Mode: p.payment_method,
      Date: formatDate(p.paid_at),
    }
  })
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentsSheet), 'Paiements')

  const yearsSheet = (schoolYears ?? []).map((y) => ({
    Nom: y.name,
    Debut: formatDate(y.start_date),
    Fin: formatDate(y.end_date),
    Active: y.is_current ? 'Oui' : 'Non',
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(yearsSheet), 'Années scolaires')

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  const filename = `edukoo-export-${school.name.replace(/[^a-z0-9]+/gi, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
