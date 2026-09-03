import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { getDictionary } from '@/lib/i18n'

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
  title: { fontSize: 17, fontWeight: 700, color: '#4c1d95', textAlign: 'center', marginBottom: 36, textTransform: 'uppercase' },
  body: { fontSize: 12, lineHeight: 1.8, textAlign: 'justify', marginBottom: 36 },
  bold: { fontWeight: 700 },
  signature: { alignSelf: 'flex-end', textAlign: 'center', marginTop: 40 },
  signatureLine: { fontSize: 10, color: '#6b7280' },
  signatureName: { fontSize: 11, fontWeight: 700, marginTop: 30 },
  footer: { marginTop: 60, borderTop: '1 solid #e5e7eb', paddingTop: 12, fontSize: 9, color: '#9ca3af', textAlign: 'center' },
})

export interface CertificateData {
  schoolName: string
  schoolAddress?: string | null
  schoolPhone?: string | null
  schoolLogoUrl?: string | null
  title: string
  bodyLines: string[]
  issuedAt: string
  directorName?: string | null
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  const t = getDictionary().documents.common

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

        <Text style={styles.title}>{data.title}</Text>

        <View style={styles.body}>
          {data.bodyLines.map((line, i) => (
            <Text key={i} style={{ marginBottom: 10 }}>
              {line}
            </Text>
          ))}
        </View>

        <View style={styles.signature}>
          <Text style={styles.signatureLine}>
            {t.madeAtTemplate
              .replace('{school}', data.schoolName)
              .replace(
                '{date}',
                new Date(data.issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
              )}
          </Text>
          <Text style={styles.signatureLine}>{t.directorLine}</Text>
          {data.directorName && <Text style={styles.signatureName}>{data.directorName}</Text>}
        </View>

        <View style={styles.footer}>
          <Text>{t.genericFooter}</Text>
        </View>
      </Page>
    </Document>
  )
}
