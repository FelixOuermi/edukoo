// Test de régression pour l'isolation multi-tenant.
//
// Rejoue, avec deux vraies sessions authentifiées (école A et école B), les
// deux classes de faille déjà corrigées deux fois dans ce projet :
//
//   1. Isolation par école (migration 0001) : un directeur ne doit jamais
//      pouvoir lire ou écrire une ligne d'une AUTRE école, même en
//      appelant l'API Supabase directement (hors app, sans passer par
//      l'UI). Vérifié ici sur schools/classes/students.
//
//   2. Cohérence student_id/class_id (migration 0021) : un directeur ne
//      doit jamais pouvoir insérer une ligne avec son propre school_id
//      mais un student_id/class_id appartenant à une AUTRE école (ce que
//      la policy "school_id = current_school_id()" seule ne bloque pas).
//      Vérifié ici sur messages, disciplinary_records, lesson_logs et
//      timetable_slots — les 4 tables listées dans la migration.
//
// Ce script utilise la clé anonyme + une vraie connexion (comme l'app),
// jamais la service role key : c'est la RLS elle-même qui est testée, pas
// contournée.
//
// Prérequis : deux écoles de TEST dédiées (jamais des écoles réelles), à
// créer une fois via /auth/register. Voir scripts/README.md.
//
// Lancement : node scripts/test-tenant-isolation.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'

function loadEnvLocal() {
  if (!existsSync('.env.local')) return
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].trim()
    }
  }
}
loadEnvLocal()

const {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  E2E_SCHOOL_A_EMAIL,
  E2E_SCHOOL_A_PASSWORD,
  E2E_SCHOOL_B_EMAIL,
  E2E_SCHOOL_B_PASSWORD,
} = process.env

const missing = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'E2E_SCHOOL_A_EMAIL',
  'E2E_SCHOOL_A_PASSWORD',
  'E2E_SCHOOL_B_EMAIL',
  'E2E_SCHOOL_B_PASSWORD',
].filter((k) => !process.env[k])

if (missing.length > 0) {
  console.error(
    `Variables manquantes : ${missing.join(', ')}\n` +
      'Voir scripts/README.md pour créer les deux écoles de test et les configurer.'
  )
  process.exit(1)
}

let passCount = 0
let failCount = 0

function report(label, ok, detail) {
  if (ok) {
    passCount++
    console.log(`  OK   ${label}`)
  } else {
    failCount++
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function signIn(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Connexion échouée pour ${email} : ${error.message}`)
  }
  const {
    data: { user },
  } = await client.auth.getUser()
  const { data: teacherRow, error: teacherError } = await client
    .from('teachers')
    .select('id, school_id')
    .eq('user_id', user.id)
    .single()
  if (teacherError || !teacherRow) {
    throw new Error(
      `Impossible de résoudre la ligne teachers pour ${email} : ${teacherError?.message ?? 'aucune ligne'}`
    )
  }
  return { client, teacherId: teacherRow.id, schoolId: teacherRow.school_id }
}

// Crée un jeu de fixtures minimal (année scolaire, classe, matière, élève)
// dans l'école du client fourni, préfixé "E2E-Isolation" pour rester
// repérable. Comme les autres tests e2e du projet, ces données persistent
// (pas de suppression) — voir scripts/README.md.
async function seedFixtures(client, schoolId, tag) {
  const { data: schoolYear, error: syError } = await client
    .from('school_years')
    .insert({
      school_id: schoolId,
      name: `E2E-Isolation SY ${tag}`,
      start_date: '2030-01-01',
      end_date: '2030-06-30',
    })
    .select('id')
    .single()
  if (syError) throw new Error(`seed school_year ${tag}: ${syError.message}`)

  const { data: klass, error: classError } = await client
    .from('classes')
    .insert({
      school_id: schoolId,
      school_year_id: schoolYear.id,
      name: `E2E-Isolation Classe ${tag}`,
    })
    .select('id')
    .single()
  if (classError) throw new Error(`seed classe ${tag}: ${classError.message}`)

  const { data: subject, error: subjectError } = await client
    .from('subjects')
    .insert({ school_id: schoolId, name: `E2E-Isolation Matière ${tag}` })
    .select('id')
    .single()
  if (subjectError) throw new Error(`seed matière ${tag}: ${subjectError.message}`)

  const { data: student, error: studentError } = await client
    .from('students')
    .insert({
      school_id: schoolId,
      class_id: klass.id,
      first_name: 'E2E-Isolation',
      last_name: tag,
    })
    .select('id')
    .single()
  if (studentError) throw new Error(`seed élève ${tag}: ${studentError.message}`)

  return { schoolYearId: schoolYear.id, classId: klass.id, subjectId: subject.id, studentId: student.id }
}

async function main() {
  console.log('Connexion des deux comptes de test...')
  const a = await signIn(E2E_SCHOOL_A_EMAIL, E2E_SCHOOL_A_PASSWORD)
  const b = await signIn(E2E_SCHOOL_B_EMAIL, E2E_SCHOOL_B_PASSWORD)

  if (a.schoolId === b.schoolId) {
    console.error(
      'E2E_SCHOOL_A_* et E2E_SCHOOL_B_* pointent vers la MÊME école ' +
        `(${a.schoolId}). Il faut deux écoles distinctes pour tester l'isolation. ` +
        'Voir scripts/README.md.'
    )
    process.exit(1)
  }

  console.log('Écoles A et B confirmées distinctes. Création des fixtures...')
  const fixturesA = await seedFixtures(a.client, a.schoolId, 'A')
  const fixturesB = await seedFixtures(b.client, b.schoolId, 'B')

  console.log('\n--- 1. Isolation par école (migration 0001) ---')

  {
    const { data } = await a.client.from('schools').select('id').eq('id', b.schoolId)
    report('A ne peut pas lire la fiche école de B', (data ?? []).length === 0)
  }
  {
    const { data } = await a.client.from('classes').select('id').eq('id', fixturesB.classId)
    report('A ne peut pas lire une classe de B', (data ?? []).length === 0)
  }
  {
    const { data } = await a.client.from('students').select('id').eq('id', fixturesB.studentId)
    report('A ne peut pas lire un élève de B', (data ?? []).length === 0)
  }
  {
    // Tentative d'IDOR direct : garder son propre school_id mais viser la
    // classe de l'autre école dans le WITH CHECK d'un INSERT students.
    const { error } = await a.client.from('students').insert({
      school_id: b.schoolId,
      class_id: fixturesB.classId,
      first_name: 'IDOR',
      last_name: 'Test',
    })
    report('A ne peut pas insérer un élève avec school_id = B', !!error)
  }

  console.log('\n--- 2. Cohérence student_id/class_id (migration 0021) ---')

  {
    const { error } = await a.client.from('messages').insert({
      school_id: a.schoolId,
      student_id: fixturesB.studentId, // élève de B, school_id de A
      sender_role: 'staff',
      sender_name: 'E2E-Isolation Attacker',
      sender_teacher_id: a.teacherId,
      body: 'fuite via IDOR',
    })
    report('A ne peut pas insérer un message ciblant un élève de B', !!error)
  }
  {
    const { error } = await a.client.from('disciplinary_records').insert({
      school_id: a.schoolId,
      student_id: fixturesB.studentId,
      type: 'remark',
      description: 'fuite via IDOR',
      recorded_by: 'E2E-Isolation Attacker',
    })
    report('A ne peut pas insérer une sanction ciblant un élève de B', !!error)
  }
  {
    const { error } = await a.client.from('lesson_logs').insert({
      school_id: a.schoolId,
      class_id: fixturesB.classId, // classe de B, school_id de A
      subject_id: fixturesA.subjectId,
      lesson_content: 'fuite via IDOR',
    })
    report('A ne peut pas insérer un cahier de texte ciblant une classe de B', !!error)
  }
  {
    const { error } = await a.client.from('timetable_slots').insert({
      school_id: a.schoolId,
      school_year_id: fixturesA.schoolYearId,
      class_id: fixturesB.classId,
      subject_id: fixturesA.subjectId,
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:00',
    })
    report("A ne peut pas insérer un créneau ciblant une classe de B", !!error)
  }

  console.log('\n--- 3. Non-régression : les opérations légitimes marchent toujours ---')

  {
    const { error } = await a.client.from('messages').insert({
      school_id: a.schoolId,
      student_id: fixturesA.studentId, // propre élève, cette fois
      sender_role: 'staff',
      sender_name: 'E2E-Isolation Legit',
      sender_teacher_id: a.teacherId,
      body: 'message légitime',
    })
    report('A peut toujours insérer un message sur son propre élève', !error, error?.message)
  }
  {
    const { data } = await a.client.from('students').select('id').eq('id', fixturesA.studentId)
    report('A peut toujours lire son propre élève', (data ?? []).length === 1)
  }

  console.log(`\n${passCount} succès, ${failCount} échec(s).`)
  if (failCount > 0) {
    console.log(
      '\nUn FAIL ci-dessus signifie qu\'une donnée est lisible/écrivable ' +
        "cross-tenant : c'est exactement la classe de faille corrigée dans " +
        '0001_fix_tenant_isolation.sql et 0021_fix_cross_tenant_isolation.sql. ' +
        'Ne pas déployer avant correction.'
    )
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('\nErreur inattendue :', err.message)
  process.exit(1)
})
