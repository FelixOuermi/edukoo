-- École
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'trial'
    CHECK (plan IN ('trial','starter','school','premium')),
  plan_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  director_name TEXT,
  nif TEXT,
  orange_money TEXT,
  moov_money TEXT,
  whatsapp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Années scolaires
CREATE TABLE school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Périodes (trimestres, semestres...) d'une année scolaire, avec dates
-- réelles. `grades.trimester` référence `periods.number`, pas cette table
-- directement (permet de ne pas forcer une période pour chaque note).
CREATE TABLE periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  number INTEGER NOT NULL CHECK (number BETWEEN 1 AND 6),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_year_id, number),
  CHECK (end_date > start_date)
);

-- Classes
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT,
  max_students INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matières
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  coefficient INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coefficient d'une matière spécifique à une classe (surcharge le
-- coefficient global de subjects quand une ligne existe pour la paire).
CREATE TABLE class_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  coefficient INTEGER NOT NULL DEFAULT 1 CHECK (coefficient > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (class_id, subject_id)
);

-- Enseignants
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'teacher'
    CHECK (role IN ('director','teacher')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Élèves
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  photo_url TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  parent_whatsapp TEXT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','suspended','left')),
  registration_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frais de scolarité
CREATE TABLE fee_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  installments INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paiements scolarité
CREATE TABLE fee_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES fee_structures(id)
    ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  installment_number INTEGER DEFAULT 1,
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN
    ('cash','orange_money','moov_money','transfer')),
  receipt_number TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Types de notes (devoir, interrogation, composition...), propres à
-- chaque école, avec un poids utilisé pour la moyenne pondérée d'une
-- matière (indépendant du coefficient de la matière elle-même).
CREATE TABLE grade_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight DECIMAL(4,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notes
CREATE TABLE grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  grade_type_id UUID NOT NULL REFERENCES grade_types(id)
    ON DELETE RESTRICT,
  trimester INTEGER CHECK (trimester BETWEEN 1 AND 6),
  score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id,
         school_year_id, trimester, grade_type_id)
);

-- Affectation d'un enseignant à ses classes/matières : restreint, pour un
-- compte 'teacher', ce qu'il peut voir/saisir dans Notes et Absences.
CREATE TABLE teacher_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, class_id, subject_id)
);

-- Appréciation générale d'un bulletin (élève × année scolaire × trimestre).
CREATE TABLE bulletin_appreciations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  trimester INTEGER CHECK (trimester BETWEEN 1 AND 6),
  appreciation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, school_year_id, trimester)
);

-- Journal d'audit : trace les actions sensibles (rôle, activation, suppression
-- d'élève, paiement...) avec leur auteur, une description lisible et un
-- horodatage. Lecture réservée au directeur (côté application).
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Absences
CREATE TABLE absences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  absence_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_justified BOOLEAN DEFAULT false,
  reason TEXT,
  parent_notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provisionnement automatique école + enseignant à l'inscription
-- (SECURITY DEFINER : contourne la RLS, s'exécute même sans session
-- active, ce qui est nécessaire quand la confirmation d'email est activée)
CREATE OR REPLACE FUNCTION handle_new_school_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_school_id UUID;
BEGIN
  IF NEW.raw_user_meta_data ? 'school_name' THEN
    INSERT INTO schools (name, director_name, email, plan)
    VALUES (
      NEW.raw_user_meta_data->>'school_name',
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'trial'
    )
    RETURNING id INTO new_school_id;

    INSERT INTO teachers (school_id, user_id, name, email, role)
    VALUES (
      new_school_id,
      NEW.id,
      NEW.raw_user_meta_data->>'director_name',
      NEW.email,
      'director'
    );

    INSERT INTO grade_types (school_id, name, weight)
    VALUES (new_school_id, 'Devoir', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_school_signup();

-- Numérotation reçus
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq
  START 1000;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number :=
    'REC-' ||
    TO_CHAR(NOW(), 'YYYY') ||
    '-' ||
    LPAD(nextval('receipt_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON fee_payments
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL
        OR NEW.receipt_number = '')
  EXECUTE FUNCTION generate_receipt_number();

-- RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_appreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Résout l'école de l'utilisateur connecté. SECURITY DEFINER : contourne
-- la RLS de `teachers` en interne, donc pas de récursion avec la policy
-- de `teachers` elle-même définie plus bas.
CREATE OR REPLACE FUNCTION current_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Résout le rôle du compte connecté ('director' / 'teacher'). Utilisée par
-- l'application pour adapter navigation et accès, et par le garde-fou
-- ci-dessous pour empêcher l'auto-élévation de privilège.
CREATE OR REPLACE FUNCTION current_teacher_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Résout la ligne teachers.id du compte connecté. Utilisée par la RLS de
-- `grades` pour vérifier l'affectation via teacher_subjects (voir plus bas).
CREATE OR REPLACE FUNCTION current_teacher_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM teachers WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- La RLS de `teachers` n'isole qu'au niveau école : sans ce garde-fou, un
-- compte enseignant pourrait s'auto-promouvoir directeur (ou réactiver un
-- collègue désactivé) via un appel REST direct qui contourne les Server
-- Actions applicatives.
CREATE OR REPLACE FUNCTION guard_teacher_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.is_active IS DISTINCT FROM OLD.is_active)
     AND COALESCE(current_teacher_role(), '') <> 'director' THEN
    RAISE EXCEPTION 'Seul un directeur peut modifier le rôle ou le statut du personnel.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "School isolation: schools"
  ON schools FOR ALL TO authenticated
  USING (id = current_school_id())
  WITH CHECK (id = current_school_id());
CREATE POLICY "School isolation: school_years"
  ON school_years FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: periods"
  ON periods FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: classes"
  ON classes FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: subjects"
  ON subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: class_subjects"
  ON class_subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: teachers"
  ON teachers FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: teacher_subjects"
  ON teacher_subjects FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: students"
  ON students FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: fee_structures"
  ON fee_structures FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: fee_payments"
  ON fee_payments FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
-- La lecture des notes reste scopée uniquement à l'école (un enseignant
-- peut consulter le dossier complet d'un élève). L'écriture est en plus
-- restreinte à l'affectation de l'enseignant via teacher_subjects — le
-- directeur n'est jamais concerné par cette restriction supplémentaire.
CREATE POLICY "School isolation: grades select"
  ON grades FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "School isolation: grades insert"
  ON grades FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );
CREATE POLICY "School isolation: grades update"
  ON grades FOR UPDATE TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );
CREATE POLICY "School isolation: grades delete"
  ON grades FOR DELETE TO authenticated
  USING (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = grades.class_id
          AND ts.subject_id = grades.subject_id
      )
    )
  );
CREATE POLICY "School isolation: grade_types"
  ON grade_types FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: bulletin_appreciations"
  ON bulletin_appreciations FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: audit_log"
  ON audit_log FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: absences"
  ON absences FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE TRIGGER teachers_privileged_fields_guard
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION guard_teacher_privileged_fields();
