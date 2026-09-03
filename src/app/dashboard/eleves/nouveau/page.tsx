import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewStudentForm } from './new-student-form'

export default async function NouvelElevePage() {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().students

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', school.id)
    .order('name')

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard/eleves" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> {t.backToStudents}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">{t.newTitle}</h1>

      <NewStudentForm classes={classes ?? []} />
    </div>
  )
}
