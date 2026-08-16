import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2 solid #7c3aed',
    paddingBottom: 16,
    marginBottom: 20,
  },
  schoolName: { fontSize: 16, fontWeight: 700, color: '#4c1d95' },
  schoolMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  receiptTitle: { fontSize: 18, fontWeight: 700, color: '#7c3aed', textAlign: 'right' },
  receiptNumber: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#6b7280' },
  value: { fontWeight: 700 },
  amountBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    padding: 16,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountLabel: { fontSize: 10, color: '#6b7280' },
  amountValue: { fontSize: 22, fontWeight: 700, color: '#4c1d95', marginTop: 4 },
  footer: { marginTop: 40, borderTop: '1 solid #e5e7eb', paddingTop: 12, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
})

const paymentMethodLabel: Record<string, string> = {
  cash: 'Espèces',
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  transfer: 'Virement',
}

export interface ReceiptData {
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
  receiptNumber: string
  studentName: string
  className?: string | null
  amount: number
  installmentNumber: number
  paymentMethod: string
  paidAt: string
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const formattedAmount = new Intl.NumberFormat('fr-FR').format(Math.round(data.amount))

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.schoolName}>{data.schoolName}</Text>
            {data.schoolAddress && <Text style={styles.schoolMeta}>{data.schoolAddress}</Text>}
            {data.schoolPhone && <Text style={styles.schoolMeta}>{data.schoolPhone}</Text>}
          </View>
          <View>
            <Text style={styles.receiptTitle}>REÇU DE PAIEMENT</Text>
            <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Élève</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Classe</Text>
            <Text style={styles.value}>{data.className ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tranche</Text>
            <Text style={styles.value}>{data.installmentNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mode de paiement</Text>
            <Text style={styles.value}>{paymentMethodLabel[data.paymentMethod] ?? data.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(data.paidAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Montant reçu</Text>
          <Text style={styles.amountValue}>{formattedAmount} FCFA</Text>
        </View>

        <View style={styles.footer}>
          <Text>Reçu généré par SchoolPro — merci de conserver ce document.</Text>
        </View>
      </Page>
    </Document>
  )
}
