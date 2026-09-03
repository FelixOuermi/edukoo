import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { ServiceReceiptDocument } from '@/lib/pdf/service-receipt-document'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('service_payments')
    .select('*, service_subscriptions(service_type, students(first_name, last_name, classes(name)))')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 })
  }

  const subscription = payment.service_subscriptions as unknown as {
    service_type: 'canteen' | 'transport'
    students: { first_name: string; last_name: string; classes: { name: string } | null } | null
  } | null
  const student = subscription?.students ?? null

  const buffer = await renderToBuffer(
    <ServiceReceiptDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        receiptNumber: payment.receipt_number ?? '—',
        studentName: student ? `${student.first_name} ${student.last_name}` : '—',
        className: student?.classes?.name,
        serviceType: subscription?.service_type ?? 'canteen',
        periodMonth: payment.period_month,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        paidAt: payment.paid_at,
      }}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="recu-${payment.receipt_number}.pdf"`,
    },
  })
}
