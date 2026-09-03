'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentSchool } from '@/lib/school'
import { timesOverlap } from '@/lib/timetable'
import { getDictionary } from '@/lib/i18n'

export async function createRoom(_prevState: unknown, formData: FormData) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim()
  const capacity = formData.get('capacity') ? Number(formData.get('capacity')) : null

  if (!name) return { error: getDictionary().errors.roomNameRequired }

  const { error } = await supabase.from('rooms').insert({ school_id: school.id, name, capacity })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/salles')
  return { success: true }
}

export async function deleteRoom(id: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase.from('rooms').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/salles')
  return { success: true }
}

export async function createBooking(_prevState: unknown, formData: FormData) {
  const { school, teacherName: actorName } = await getCurrentSchool()
  const supabase = await createClient()

  const roomId = formData.get('roomId') as string
  const bookingDate = formData.get('bookingDate') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const purpose = (formData.get('purpose') as string)?.trim()

  const t = getDictionary().errors
  if (!roomId || !bookingDate || !startTime || !endTime || !purpose) {
    return { error: t.roomFieldsRequired }
  }
  if (startTime >= endTime) return { error: t.endTimeAfterStartTime }

  const { data: existing } = await supabase
    .from('room_bookings')
    .select('start_time, end_time')
    .eq('school_id', school.id)
    .eq('room_id', roomId)
    .eq('booking_date', bookingDate)

  const conflict = (existing ?? []).some((b) => timesOverlap(startTime, endTime, b.start_time, b.end_time))
  if (conflict) return { error: t.roomAlreadyBooked }

  const { error } = await supabase.from('room_bookings').insert({
    school_id: school.id,
    room_id: roomId,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    purpose,
    booked_by: actorName,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/salles')
  return { success: true }
}

export async function deleteBooking(id: string) {
  const { school } = await getCurrentSchool()
  const supabase = await createClient()

  const { error } = await supabase.from('room_bookings').delete().eq('id', id).eq('school_id', school.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/salles')
  return { success: true }
}
