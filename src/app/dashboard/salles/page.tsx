import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { getDictionary } from '@/lib/i18n'
import { NewRoomForm, DeleteRoomButton, NewBookingForm, DeleteBookingButton } from './room-form'

export default async function SallesPage() {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()
  const t = getDictionary().roomsPage

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    supabase.from('rooms').select('id, name, capacity').eq('school_id', school.id).order('name'),
    supabase
      .from('room_bookings')
      .select('id, booking_date, start_time, end_time, purpose, booked_by, rooms(name)')
      .eq('school_id', school.id)
      .gte('booking_date', today)
      .order('booking_date')
      .order('start_time'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableRoom}</th>
                  <th className="px-4 py-3 font-medium text-right">{t.tableCapacity}</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(rooms ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.capacity ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteRoomButton id={r.id} />
                    </td>
                  </tr>
                ))}
                {(rooms ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      {t.noRoomsCreated}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <NewRoomForm />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.tableDate}</th>
                  <th className="px-4 py-3 font-medium">{t.tableSchedule}</th>
                  <th className="px-4 py-3 font-medium">{t.tableRoom}</th>
                  <th className="px-4 py-3 font-medium">{t.tablePurpose}</th>
                  <th className="px-4 py-3 font-medium">{t.tableBy}</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bookings ?? []).map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                      {new Date(b.booking_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(b.rooms as unknown as { name: string } | null)?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.purpose}</td>
                    <td className="px-4 py-3 text-gray-600">{b.booked_by}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteBookingButton id={b.id} />
                    </td>
                  </tr>
                ))}
                {(bookings ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      {t.noUpcomingBookings}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(rooms ?? []).length > 0 && <NewBookingForm rooms={rooms ?? []} />}
        </div>
      </div>
    </div>
  )
}
