'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { updateSchoolInfo, createSchoolYear, upsertFeeStructure, setCurrentSchoolYear, uploadSchoolLogo, createPeriod, deletePeriod } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.settingsPage

interface School {
  name: string
  address: string | null
  phone: string | null
  nif: string | null
  director_name: string | null
  orange_money: string | null
  moov_money: string | null
  whatsapp: string | null
  absence_alert_threshold: number
}

export function SchoolInfoForm({ school }: { school: School }) {
  const [state, formAction, pending] = useActionState(updateSchoolInfo, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.schoolInfoTitle}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.schoolName}</label>
          <input
            type="text"
            name="name"
            defaultValue={school.name}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.director}</label>
          <input
            type="text"
            name="directorName"
            defaultValue={school.director_name ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
          <input
            type="text"
            name="address"
            defaultValue={school.address ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
          <input
            type="text"
            name="phone"
            defaultValue={school.phone ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.nif}</label>
          <input
            type="text"
            name="nif"
            defaultValue={school.nif ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.whatsappSchool}</label>
          <input
            type="text"
            name="whatsapp"
            defaultValue={school.whatsapp ?? ''}
            placeholder="+225 ..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.orangeMoneyNumber}</label>
          <input
            type="text"
            name="orangeMoney"
            defaultValue={school.orange_money ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.moovMoneyNumber}</label>
          <input
            type="text"
            name="moovMoney"
            defaultValue={school.moov_money ?? ''}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.absenceThresholdLabel}
          </label>
          <input
            type="number"
            name="absenceAlertThreshold"
            min={1}
            defaultValue={school.absence_alert_threshold}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {t.absenceThresholdHint}
          </p>
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.saved}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : dict.common.save}
      </button>
    </form>
  )
}

export function ActivateSchoolYearButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await setCurrentSchoolYear(id) })}
      className="text-xs font-medium text-[#7c3aed] hover:underline disabled:opacity-50"
    >
      {pending ? t.activating : t.activate}
    </button>
  )
}

export function SchoolYearForm() {
  const [state, formAction, pending] = useActionState(createSchoolYear, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.newSchoolYear}</h2>
      <input
        type="text"
        name="name"
        required
        placeholder={t.schoolYearNamePlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          name="startDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="date"
          name="endDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.creating : t.createAndActivate}
      </button>
    </form>
  )
}

export function FeeStructureForm({ classes }: { classes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(upsertFeeStructure, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.feeStructureTitle}</h2>
      <select
        name="classId"
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      >
        <option value="">{t.selectClassPlaceholder}</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="totalAmount"
        min={1}
        required
        placeholder={t.annualAmountPlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      <input
        type="number"
        name="installments"
        defaultValue={3}
        min={1}
        placeholder={t.installmentsCountPlaceholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">{t.feeStructureSaved}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.saving : t.saveFeeStructure}
      </button>
    </form>
  )
}

const initialLogoState: { error?: string; success?: boolean; logoUrl?: string } = {}

export function LogoUploadForm({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl)
  const [state, formAction, pending] = useActionState(async (_prev: typeof initialLogoState, formData: FormData) => {
    const result = await uploadSchoolLogo(_prev, formData)
    if (result?.logoUrl) setPreview(result.logoUrl)
    formRef.current?.reset()
    return result
  }, initialLogoState)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">{t.schoolLogoTitle}</h2>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t.schoolLogoTitle} className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-gray-400 text-center px-1">{t.noLogo}</span>
          )}
        </div>
        <form ref={formRef} action={formAction} className="flex-1 space-y-2">
          <label className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer text-gray-700">
            {pending ? t.sending : t.chooseImage}
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={pending}
              onChange={(e) => e.target.files?.length && e.target.form?.requestSubmit()}
            />
          </label>
          <p className="text-[11px] text-gray-400">{t.logoHint}</p>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state?.success && <p className="text-xs text-emerald-600">{t.logoUpdated}</p>}
        </form>
      </div>
    </div>
  )
}

export function PeriodForm({ nextNumber }: { nextNumber: number }) {
  const [state, formAction, pending] = useActionState(createPeriod, null)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addPeriod}</h2>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          name="number"
          defaultValue={nextNumber}
          min={1}
          max={6}
          placeholder={t.numberPlaceholder}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="text"
          name="name"
          required
          placeholder={t.periodNamePlaceholder}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          name="startDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="date"
          name="endDate"
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : t.addOrUpdate}
      </button>
    </form>
  )
}

export function DeletePeriodButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null)
            const result = await deletePeriod(id)
            if (result?.error) setError(result.error)
          })
        }
        className="text-xs text-gray-400 hover:text-rose-600 disabled:opacity-50"
      >
        {dict.common.delete}
      </button>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  )
}
