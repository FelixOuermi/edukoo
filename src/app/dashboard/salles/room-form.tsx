'use client'

import { useActionState, useTransition } from 'react'
import { createRoom, deleteRoom, createBooking, deleteBooking } from './actions'
import { getDictionary } from '@/lib/i18n'

const dict = getDictionary()
const t = dict.roomsPage

const initialState: { error?: string; success?: boolean } = {}

export function NewRoomForm() {
  const [state, formAction, pending] = useActionState(createRoom, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.addRoom}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          name="name"
          placeholder={t.namePlaceholder}
          required
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="number"
          name="capacity"
          min={1}
          placeholder={t.capacityPlaceholder}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.adding : dict.common.add}
      </button>
    </form>
  )
}

export function DeleteRoomButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteRoom(id) })}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {dict.common.delete}
    </button>
  )
}

export function NewBookingForm({ rooms }: { rooms: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createBooking, initialState)

  return (
    <form action={formAction} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">{t.bookRoom}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          name="roomId"
          required
          defaultValue=""
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        >
          <option value="" disabled>
            {t.roomPlaceholder}
          </option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="bookingDate"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="time"
          name="startTime"
          required
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <input
          type="time"
          name="endTime"
          required
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
      </div>
      <input
        type="text"
        name="purpose"
        placeholder={t.purposePlaceholder}
        required
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-600">{t.bookingAdded}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-[#7c3aed] hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {pending ? t.booking : t.book}
      </button>
    </form>
  )
}

export function DeleteBookingButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteBooking(id) })}
      className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
    >
      {t.cancel}
    </button>
  )
}
