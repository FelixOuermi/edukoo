import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { EditStudentForm } from './edit-student-form'

export default async function ModifierElevePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().students

  const [{ data: student }, { data: classes }] = await Promise.all([
    supabase.from('students').select('*').eq('id', id).eq('school_id', school.id).maybeSingle(),
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
  ])

  if (!student) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/dashboard/eleves/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToStudentProfile}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{t.editTitle}</h1>

      <EditStudentForm student={student} classes={classes ?? []} />
    </div>
  )
}
