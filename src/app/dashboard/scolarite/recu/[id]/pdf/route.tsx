import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { requireDirector } from '@/lib/school'
import { ReceiptDocument } from '@/lib/pdf/receipt-document'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { school } = await requireDirector()
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('fee_payments')
    .select('*, students(first_name, last_name, classes(name))')
    .eq('id', id)
    .eq('school_id', school.id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Reçu introuvable' }, { status: 404 })
  }

  const student = payment.students as unknown as {
    first_name: string
    last_name: string
    classes: { name: string } | null
  } | null

  const buffer = await renderToBuffer(
    <ReceiptDocument
      data={{
        schoolName: school.name,
        schoolAddress: school.address,
        schoolPhone: school.phone,
        receiptNumber: payment.receipt_number ?? '—',
        studentName: student ? `${student.first_name} ${student.last_name}` : '—',
        className: student?.classes?.name,
        amount: Number(payment.amount),
        installmentNumber: payment.installment_number,
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
