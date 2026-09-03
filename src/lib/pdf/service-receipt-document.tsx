import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2 solid #7c3aed',
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerLeft: { flexShrink: 1, flexGrow: 0, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, objectFit: 'contain' },
  headerRight: { flexShrink: 1, flexGrow: 0, alignItems: 'flex-end' },
  schoolName: { fontSize: 15, fontWeight: 700, color: '#4c1d95' },
  schoolMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  receiptTitle: { fontSize: 15, fontWeight: 700, color: '#7c3aed', textAlign: 'right' },
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

const serviceLabel: Record<string, string> = {
  canteen: 'Cantine',
  transport: 'Transport',
}

export interface ServiceReceiptData {
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
  schoolLogoUrl?: string | null
  receiptNumber: string
  studentName: string
  className?: string | null
  serviceType: 'canteen' | 'transport'
  periodMonth: string
  amount: number
  paymentMethod: string
  paidAt: string
}

function formatFCFA(amount: number) {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function ServiceReceiptDocument({ data }: { data: ServiceReceiptData }) {
  const formattedAmount = formatFCFA(data.amount)

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {data.schoolLogoUrl && <Image src={data.schoolLogoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.schoolName}>{data.schoolName}</Text>
              {data.schoolAddress && <Text style={styles.schoolMeta}>{data.schoolAddress}</Text>}
              {data.schoolPhone && <Text style={styles.schoolMeta}>{data.schoolPhone}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptTitle}>REÇU — {serviceLabel[data.serviceType].toUpperCase()}</Text>
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
            <Text style={styles.label}>Période</Text>
            <Text style={styles.value}>
              {new Date(data.periodMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </Text>
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
          <Text>Reçu généré par Edukoo — merci de conserver ce document.</Text>
        </View>
      </Page>
    </Document>
  )
}
