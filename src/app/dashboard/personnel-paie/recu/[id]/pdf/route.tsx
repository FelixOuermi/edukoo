import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { PayrollReceiptDocument } from '@/lib/pdf/payroll-receipt-document'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payroll_payments')
    .select('*, staff_members(name, role_title)')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 })
  }

  const staffMember = payment.staff_members as unknown as { name: string; role_title: string | null } | null

  const buffer = await renderToBuffer(
    <PayrollReceiptDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        schoolLogoUrl: school.logo_url,
        receiptNumber: payment.receipt_number ?? '—',
        staffMemberName: staffMember?.name ?? '—',
        roleTitle: staffMember?.role_title ?? null,
        periodMonth: payment.period_month,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        paidAt: payment.paid_at,
        note: payment.note,
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
