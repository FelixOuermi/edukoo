import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { SchoolInfoForm, SchoolYearForm, FeeStructureForm, ActivateSchoolYearButton, LogoUploadForm, PeriodForm, DeletePeriodButton } from './settings-forms'

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA'
}

export default async function ParametresPage() {
  const { school, schoolYear } = await requireDirector()
  const supabase = await createClient()

  const [{ data: schoolYears }, { data: classes }, { data: feeStructures }, { data: periods }] = await Promise.all([
    supabase.from('school_years').select('*').eq('school_id', school.id).order('start_date', { ascending: false }),
    supabase.from('classes').select('id, name').eq('school_id', school.id).order('name'),
    schoolYear
      ? supabase
          .from('fee_structures')
          .select('class_id, total_amount, installments')
          .eq('school_id', school.id)
          .eq('school_year_id', schoolYear.id)
      : Promise.resolve({ data: [] as { class_id: string; total_amount: number; installments: number }[] }),
    schoolYear
      ? supabase.from('periods').select('*').eq('school_id', school.id).eq('school_year_id', schoolYear.id).order('number')
      : Promise.resolve({ data: [] as { id: string; number: number; name: string; start_date: string; end_date: string }[] }),
  ])

  const feeByClass = new Map((feeStructures ?? []).map((f) => [f.class_id, f]))
  const nextPeriodNumber = Math.min(((periods ?? []).length || 0) + 1, 6)

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>

      <LogoUploadForm currentLogoUrl={school.logo_url} />

      <SchoolInfoForm school={school} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Années scolaires</h2>
            <ul className="divide-y divide-gray-100">
              {(schoolYears ?? []).map((y) => (
                <li key={y.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-800">{y.name}</span>
                  {y.is_current ? (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <ActivateSchoolYearButton id={y.id} />
                  )}
                </li>
              ))}
              {(schoolYears ?? []).length === 0 && (
                <li className="py-2 text-sm text-gray-400">Aucune année scolaire.</li>
              )}
            </ul>
          </div>
          <SchoolYearForm />
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Grille tarifaire par classe</h2>
            {!schoolYear ? (
              <p className="text-sm text-amber-600">Activez une année scolaire pour définir les frais.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(classes ?? []).map((c) => {
                  const fee = feeByClass.get(c.id)
                  return (
                    <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-800">{c.name}</span>
                      <span className="text-gray-600">
                        {fee ? `${formatFCFA(Number(fee.total_amount))} (${fee.installments} tranches)` : 'Non défini'}
                      </span>
                    </li>
                  )
                })}
                {(classes ?? []).length === 0 && (
                  <li className="py-2 text-sm text-gray-400">Aucune classe créée.</li>
                )}
              </ul>
            )}
          </div>
          <FeeStructureForm classes={classes ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Périodes (trimestres, semestres...)</h2>
            {!schoolYear ? (
              <p className="text-sm text-amber-600">Activez une année scolaire pour définir des périodes.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(periods ?? []).map((p) => (
                  <li key={p.id} className="py-2 flex items-center justify-between text-sm gap-2">
                    <span className="text-gray-800">
                      {p.number}. {p.name}
                      <span className="text-gray-400">
                        {' '}
                        ({new Date(p.start_date).toLocaleDateString('fr-FR')} → {new Date(p.end_date).toLocaleDateString('fr-FR')})
                      </span>
                    </span>
                    <DeletePeriodButton id={p.id} />
                  </li>
                ))}
                {(periods ?? []).length === 0 && (
                  <li className="py-2 text-sm text-gray-400">
                    Aucune période définie — Notes et Bulletins utilisent Trimestre 1/2/3 par défaut.
                  </li>
                )}
              </ul>
            )}
          </div>
          {schoolYear && <PeriodForm nextNumber={nextPeriodNumber} />}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Export &amp; sauvegarde</h2>
            <p className="text-sm text-gray-500 mt-1">
              Télécharge toutes les données de ton école (élèves, notes, absences, paiements...) dans un classeur Excel.
            </p>
          </div>
          <a
            href="/dashboard/parametres/export"
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> Exporter (Excel)
          </a>
        </div>
      </div>
    </div>
  )
}
