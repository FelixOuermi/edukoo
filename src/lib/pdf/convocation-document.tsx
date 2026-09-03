import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica', color: '#1f2937' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottom: '2 solid #7c3aed',
    paddingBottom: 16,
    marginBottom: 32,
  },
  logo: { width: 36, height: 36, objectFit: 'contain' },
  schoolName: { fontSize: 15, fontWeight: 700, color: '#4c1d95' },
  schoolMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  title: { fontSize: 17, fontWeight: 700, color: '#4c1d95', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase' },
  subject: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  recipient: { fontSize: 12, marginBottom: 24 },
  body: { fontSize: 12, lineHeight: 1.8, textAlign: 'justify', marginBottom: 20 },
  infoBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    padding: 16,
    marginBottom: 28,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { color: '#6b7280' },
  infoValue: { fontWeight: 700 },
  signature: { alignSelf: 'flex-end', textAlign: 'center', marginTop: 30 },
  signatureLine: { fontSize: 10, color: '#6b7280' },
  signatureName: { fontSize: 11, fontWeight: 700, marginTop: 30 },
  footer: { marginTop: 50, borderTop: '1 solid #e5e7eb', paddingTop: 12, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
})

export interface ConvocationData {
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
  schoolLogoUrl?: string | null
  recipientName: string
  studentName: string
  className?: string | null
  subject: string
  meetingDate: string
  meetingTime?: string | null
  place?: string | null
  message: string
  issuedAt: string
  directorName?: string | null
}

export function ConvocationDocument({ data }: { data: ConvocationData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {data.schoolLogoUrl && <Image src={data.schoolLogoUrl} style={styles.logo} />}
          <View>
            <Text style={styles.schoolName}>{data.schoolName}</Text>
            {data.schoolAddress && <Text style={styles.schoolMeta}>{data.schoolAddress}</Text>}
            {data.schoolPhone && <Text style={styles.schoolMeta}>{data.schoolPhone}</Text>}
          </View>
        </View>

        <Text style={styles.title}>Convocation</Text>
        <Text style={styles.subject}>{data.subject}</Text>

        <Text style={styles.recipient}>À l’attention de {data.recipientName},</Text>

        <Text style={styles.body}>
          Nous vous prions de bien vouloir vous présenter à l’établissement concernant l’élève{' '}
          <Text style={{ fontWeight: 700 }}>{data.studentName}</Text>
          {data.className ? ` (classe de ${data.className})` : ''}.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(data.meetingDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          {data.meetingTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Heure</Text>
              <Text style={styles.infoValue}>{data.meetingTime}</Text>
            </View>
          )}
          {data.place && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lieu</Text>
              <Text style={styles.infoValue}>{data.place}</Text>
            </View>
          )}
        </View>

        {data.message && <Text style={styles.body}>{data.message}</Text>}

        <View style={styles.signature}>
          <Text style={styles.signatureLine}>
            Fait à {data.schoolName}, le{' '}
            {new Date(data.issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.signatureLine}>Le Directeur / La Directrice</Text>
          {data.directorName && <Text style={styles.signatureName}>{data.directorName}</Text>}
        </View>

        <View style={styles.footer}>
          <Text>Document généré par Edukoo.</Text>
        </View>
      </Page>
    </Document>
  )
}
