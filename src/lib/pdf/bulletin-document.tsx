import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { StudentBulletin } from '@/lib/bulletin'
import { getDictionary } from '@/lib/i18n'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1f2937' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2 solid #7c3aed',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: { flexShrink: 1, flexGrow: 0, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 36, height: 36, objectFit: 'contain' },
  headerRight: { flexShrink: 1, flexGrow: 0, alignItems: 'flex-end' },
  schoolName: { fontSize: 15, fontWeight: 700, color: '#4c1d95' },
  schoolMeta: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  bulletinTitle: { fontSize: 14, fontWeight: 700, color: '#7c3aed', textAlign: 'right' },
  bulletinMeta: { fontSize: 9, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  studentBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentName: { fontSize: 12, fontWeight: 700, color: '#4c1d95' },
  studentMeta: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4c1d95',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: { color: '#ffffff', fontSize: 9, fontWeight: 700 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowWrap: { borderBottom: '1 solid #e5e7eb' },
  subjectAppreciation: { fontSize: 8, color: '#6b7280', fontStyle: 'italic', paddingHorizontal: 8, paddingBottom: 5 },
  colSubject: { width: '40%' },
  colCoef: { width: '20%', textAlign: 'center' },
  colScore: { width: '20%', textAlign: 'center' },
  colWeighted: { width: '20%', textAlign: 'center' },
  totalsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  totalItem: { alignItems: 'center' },
  totalLabel: { fontSize: 8, color: '#6b7280' },
  totalValue: { fontSize: 14, fontWeight: 700, color: '#4c1d95', marginTop: 2 },
  appreciationBox: { marginBottom: 30 },
  appreciationLabel: { fontSize: 9, fontWeight: 700, color: '#374151', marginBottom: 4 },
  appreciationLine: { borderBottom: '1 solid #d1d5db', height: 16 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  signatureBox: { width: '45%', textAlign: 'center' },
  signatureLine: { borderTop: '1 solid #9ca3af', marginTop: 30, paddingTop: 4, fontSize: 8, color: '#6b7280' },
  footer: { marginTop: 24, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
})

export interface BulletinPdfData {
  schoolName: string
  schoolAddress?: string | null
  schoolLogoUrl?: string | null
  schoolYearName: string
  trimester: number
  bulletin: StudentBulletin
}

function BulletinPage({ data }: { data: BulletinPdfData }) {
  const { schoolName, schoolAddress, schoolLogoUrl, schoolYearName, trimester, bulletin } = data
  const dict = getDictionary()
  const t = dict.documents.bulletin

  return (
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {schoolLogoUrl && <Image src={schoolLogoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.schoolName}>{schoolName}</Text>
              {schoolAddress && <Text style={styles.schoolMeta}>{schoolAddress}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.bulletinTitle}>{t.title}</Text>
            <Text style={styles.bulletinMeta}>
              {t.periodTemplate.replace('{trimester}', String(trimester)).replace('{year}', schoolYearName)}
            </Text>
          </View>
        </View>

        <View style={styles.studentBox}>
          <View>
            <Text style={styles.studentName}>{bulletin.studentName}</Text>
            <Text style={styles.studentMeta}>{t.classLabel}{bulletin.className}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSubject]}>{t.subject}</Text>
            <Text style={[styles.tableHeaderText, styles.colCoef]}>{t.coefficient}</Text>
            <Text style={[styles.tableHeaderText, styles.colScore]}>{t.scoreOn20}</Text>
            <Text style={[styles.tableHeaderText, styles.colWeighted]}>{t.weightedAverage}</Text>
          </View>
          {bulletin.subjects.map((sg) => (
            <View key={sg.subjectName} style={styles.tableRowWrap}>
              <View style={styles.tableRow}>
                <Text style={styles.colSubject}>{sg.subjectName}</Text>
                <Text style={styles.colCoef}>{sg.coefficient}</Text>
                <Text style={styles.colScore}>{sg.score !== null ? sg.score.toFixed(2) : '—'}</Text>
                <Text style={styles.colWeighted}>{sg.weighted !== null ? sg.weighted.toFixed(2) : '—'}</Text>
              </View>
              {sg.appreciation && <Text style={styles.subjectAppreciation}>{sg.appreciation}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>{t.generalAverage}</Text>
            <Text style={styles.totalValue}>
              {bulletin.average !== null ? bulletin.average.toFixed(2) : '—'}/20
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>{t.rank}</Text>
            <Text style={styles.totalValue}>
              {bulletin.rank !== null ? `${bulletin.rank}e / ${bulletin.rankedOutOf}` : '—'}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>{t.mention}</Text>
            <Text style={styles.totalValue}>{bulletin.mention}</Text>
          </View>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>
              {t.absencesTemplate.replace(
                '{scope}',
                bulletin.absencesScope === 'period' ? t.absencesScopePeriod : t.absencesScopeYear
              )}
            </Text>
            <Text style={styles.totalValue}>
              {bulletin.absencesJustified + bulletin.absencesUnjustified}
            </Text>
            <Text style={{ fontSize: 7, color: '#9ca3af', marginTop: 2 }}>
              {t.ofWhichUnjustifiedTemplate
                .replace('{count}', String(bulletin.absencesUnjustified))
                .replace('{plural}', bulletin.absencesUnjustified > 1 ? 's' : '')}
            </Text>
          </View>
        </View>

        <View style={styles.appreciationBox}>
          <Text style={styles.appreciationLabel}>{t.appreciation}</Text>
          {bulletin.appreciation ? (
            <Text style={{ fontSize: 10, color: '#1f2937', lineHeight: 1.5 }}>{bulletin.appreciation}</Text>
          ) : (
            <>
              <View style={styles.appreciationLine} />
              <View style={styles.appreciationLine} />
            </>
          )}
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.schoolStamp}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.directorSignature}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{t.footer}</Text>
        </View>
      </Page>
  )
}

export function BulletinDocument({ data }: { data: BulletinPdfData }) {
  return (
    <Document>
      <BulletinPage data={data} />
    </Document>
  )
}

export function BulletinsBatchDocument({ data }: { data: BulletinPdfData[] }) {
  return (
    <Document>
      {data.map((d) => (
        <BulletinPage key={d.bulletin.studentId} data={d} />
      ))}
    </Document>
  )
}
