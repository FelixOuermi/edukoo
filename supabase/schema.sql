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
  -- Nombre d'absences dans le mois calendaire à partir duquel les
  -- parents et le personnel sont notifiés (alerte d'absentéisme).
  absence_alert_threshold INTEGER NOT NULL DEFAULT 4
    CHECK (absence_alert_threshold > 0),
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

-- Référentiel cycle → niveau (post-primaire, secondaire général,
-- technique/pro...), par école : les séries technique/pro varient trop
-- d'un établissement à l'autre pour un référentiel national unique.
-- Chaque école part avec un jeu par défaut (secondaire général
-- burkinabè), voir seed_default_education_levels() plus bas.
CREATE TABLE education_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE TABLE education_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  cycle_id UUID REFERENCES education_cycles(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cycle_id, name)
);

-- Compteur d'usage quotidien des fonctions IA (src/lib/ai.ts), par école.
-- Le seuil du jour dépend du plan payant de l'école (voir
-- consume_ai_quota() plus bas) — évite qu'un usage répété (clics en
-- boucle) ne consomme l'API sans limite.
CREATE TABLE ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, usage_date)
);

-- Classes
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Texte libre historique, conservé en repli d'affichage pour les
  -- classes jamais rattachées à un niveau structuré (education_level_id).
  level TEXT,
  education_level_id UUID REFERENCES education_levels(id)
    ON DELETE SET NULL,
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
  -- Compte élève : lie la fiche à un utilisateur auth pour un accès en
  -- lecture seule (notes, absences, bulletins). NULL tant que l'élève n'a
  -- pas de compte. Perd tout accès si status <> 'active'.
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comptes parents : séparés du personnel (teachers), liés à un ou
-- plusieurs élèves via parent_students. Portée volontairement en lecture
-- seule côté application : un parent ne peut jamais écrire dans le
-- dossier de ses enfants.
CREATE TABLE parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liaison parent <-> élève (plusieurs enfants par parent, plusieurs
-- responsables par élève possible : parent + tuteur par ex.)
CREATE TABLE parent_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, student_id)
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
  max_score DECIMAL(5,2) DEFAULT 20 CHECK (max_score > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id,
         school_year_id, trimester, grade_type_id),
  -- Dernier rempart si un appel contourne la validation applicative
  -- (formulaire modifié via les outils navigateur, rejeu de la file
  -- hors-ligne, appel direct à l'API) : score toujours entre 0 et
  -- max_score.
  CHECK (score IS NULL OR (score >= 0 AND score <= max_score))
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
  -- Workflow de justification : un parent soumet un motif ('pending'),
  -- le personnel valide ('approved', et bascule alors is_justified à
  -- true) ou rejette ('rejected'). is_justified reste la seule source de
  -- vérité utilisée par les bulletins.
  justification_reason TEXT,
  justification_status TEXT NOT NULL DEFAULT 'none'
    CHECK (justification_status IN ('none', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empêche de lier un parent ou un élève d'une autre école (le row lui-même
-- pourrait avoir school_id = current_school_id() du directeur qui crée le
-- lien, mais parent_id/student_id référencer une autre école par erreur ou
-- via un appel REST direct).
CREATE OR REPLACE FUNCTION guard_parent_students_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM parents p
    WHERE p.id = NEW.parent_id AND p.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'parent_id doit appartenir à la même école.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id AND s.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'student_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER parent_students_school_consistency_guard
  BEFORE INSERT OR UPDATE ON parent_students
  FOR EACH ROW
  EXECUTE FUNCTION guard_parent_students_school_consistency();

-- Emploi du temps : créneaux hebdomadaires par classe. La détection de
-- conflit (même enseignant ou même salle sur deux créneaux qui se
-- chevauchent) est faite côté application (Server Action), pas en SQL.
CREATE TABLE timetable_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = lundi ... 7 = dimanche
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Annonces de l'école : actualités visibles par tout le monde (personnel,
-- parents, élèves), publiées par le directeur uniquement.
CREATE TABLE announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messagerie simple, un fil de discussion par élève, entre le personnel
-- de l'école et les parents de cet élève.
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('staff', 'parent')),
  sender_name TEXT NOT NULL,
  sender_teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  sender_parent_id UUID REFERENCES parents(id)
    ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services optionnels (cantine, transport) : contrairement à la
-- scolarité (fee_structures s'applique à toute la classe), un élève y
-- souscrit individuellement — d'où un modèle séparé. Un seul couple de
-- tables pour les deux services (discriminant service_type).
CREATE TABLE service_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('canteen', 'transport')),
  monthly_fee DECIMAL(12,2) NOT NULL CHECK (monthly_fee > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, school_year_id, service_type)
);

CREATE TABLE service_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  subscription_id UUID REFERENCES service_subscriptions(id)
    ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  period_month DATE NOT NULL,
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'transfer')),
  receipt_number TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Personnel & Paie : suit l'argent VERSÉ par l'école (salaires), flux
-- inverse de la scolarité/services (argent REÇU). `teachers` ne couvre
-- pas le personnel non-enseignant, d'où cette table de référence à part ;
-- `teacher_id` lie optionnellement un membre du personnel à son compte
-- enseignant existant (évite de ressaisir nom/téléphone) sans l'imposer.
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  name TEXT NOT NULL,
  role_title TEXT,
  phone TEXT,
  monthly_salary DECIMAL(12,2) CHECK (monthly_salary IS NULL OR monthly_salary > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id)
    ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  period_month DATE NOT NULL,
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'transfer')),
  note TEXT,
  receipt_number TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Gestion des salles comme ressource réservable : distinct de
-- timetable_slots.room (texte libre, cours récurrents) — ceci couvre les
-- réservations ponctuelles. Purement interne au personnel, pas de policy
-- parent/élève.
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id)
    ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  booked_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Cahier de textes simplifié : leçon du jour + devoir à faire, par classe
-- et matière.
CREATE TABLE lesson_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id)
    ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id)
    ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers(id)
    ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lesson_content TEXT NOT NULL,
  homework TEXT,
  homework_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discipline : sanctions/observations liées à un élève, distinctes des
-- absences, visibles dans son "carnet".
CREATE TABLE disciplinary_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('remark', 'warning', 'detention', 'suspension')),
  description TEXT NOT NULL,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Même garde-fou que guard_parent_students_school_consistency ci-dessus,
-- appliqué à messages/disciplinary_records (référencent un student_id) et
-- lesson_logs/timetable_slots (référencent un class_id) : empêche un
-- directeur/enseignant d'insérer une ligne school_id = son école mais
-- student_id/class_id d'une AUTRE école (ce que la RLS seule ne bloquait
-- pas, et que les policies de lecture parent/élève, qui ne comparaient
-- que la relation, auraient alors exposé aux vrais parents/élèves de
-- l'école ciblée).
CREATE OR REPLACE FUNCTION guard_row_student_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = NEW.student_id AND s.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'student_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION guard_row_class_school_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = NEW.class_id AND c.school_id = NEW.school_id
  ) THEN
    RAISE EXCEPTION 'class_id doit appartenir à la même école.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER messages_school_consistency_guard
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_student_school_consistency();

CREATE TRIGGER disciplinary_records_school_consistency_guard
  BEFORE INSERT OR UPDATE ON disciplinary_records
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_student_school_consistency();

CREATE TRIGGER lesson_logs_school_consistency_guard
  BEFORE INSERT OR UPDATE ON lesson_logs
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_class_school_consistency();

CREATE TRIGGER timetable_slots_school_consistency_guard
  BEFORE INSERT OR UPDATE ON timetable_slots
  FOR EACH ROW
  EXECUTE FUNCTION guard_row_class_school_consistency();

-- Provisionnement automatique école + enseignant à l'inscription
-- (SECURITY DEFINER : contourne la RLS, s'exécute même sans session
-- active, ce qui est nécessaire quand la confirmation d'email est activée)
-- Seed par défaut (secondaire général burkinabè) posé sur toute nouvelle
-- école. Le cycle technique/pro démarre sans niveau prérempli : les
-- séries (G1, G2, F1-F4, CAP, BEP...) sont trop spécifiques à chaque
-- lycée technique pour un défaut national fiable — le directeur les
-- ajoute lui-même depuis Classes & Matières.
CREATE OR REPLACE FUNCTION seed_default_education_levels(target_school_id UUID)
RETURNS VOID AS $$
DECLARE
  post_primaire_id UUID;
  secondaire_id UUID;
BEGIN
  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Post-primaire', 1)
  RETURNING id INTO post_primaire_id;

  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Secondaire général', 2)
  RETURNING id INTO secondaire_id;

  INSERT INTO education_cycles (school_id, name, display_order)
  VALUES (target_school_id, 'Enseignement technique et professionnel', 3);

  INSERT INTO education_levels (school_id, cycle_id, name, display_order) VALUES
    (target_school_id, post_primaire_id, '6e', 1),
    (target_school_id, post_primaire_id, '5e', 2),
    (target_school_id, post_primaire_id, '4e', 3),
    (target_school_id, post_primaire_id, '3e', 4),
    (target_school_id, secondaire_id, '2nde A', 1),
    (target_school_id, secondaire_id, '2nde C', 2),
    (target_school_id, secondaire_id, '1ère A', 3),
    (target_school_id, secondaire_id, '1ère C', 4),
    (target_school_id, secondaire_id, '1ère D', 5),
    (target_school_id, secondaire_id, 'Terminale A', 6),
    (target_school_id, secondaire_id, 'Terminale C', 7),
    (target_school_id, secondaire_id, 'Terminale D', 8);
END;
$$ LANGUAGE plpgsql;

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

    PERFORM seed_default_education_levels(new_school_id);
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

-- Réutilise la même séquence/fonction que fee_payments.
CREATE TRIGGER set_service_receipt_number
  BEFORE INSERT ON service_payments
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL
        OR NEW.receipt_number = '')
  EXECUTE FUNCTION generate_receipt_number();

CREATE TRIGGER set_payroll_receipt_number
  BEFORE INSERT ON payroll_payments
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
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_appreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_payments ENABLE ROW LEVEL SECURITY;

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

-- Résout parents.id du compte parent connecté (analogue à
-- current_teacher_id() pour le personnel).
CREATE OR REPLACE FUNCTION current_parent_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM parents WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- Résout l'école du compte parent connecté. Utilisée uniquement pour les
-- données de référence non sensibles (classes, matières, périodes) : ne
-- jamais l'utiliser pour scoper des données propres à un élève (voir
-- current_parent_id() + parent_students pour ça).
CREATE OR REPLACE FUNCTION current_parent_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM parents WHERE user_id = auth.uid() AND is_active = true LIMIT 1;
$$;

-- RLS seule ne peut pas restreindre QUELS champs un parent modifie (juste
-- QUELLES lignes) : ce trigger empêche un parent d'utiliser son droit de
-- soumission de motif de justification pour changer autre chose, en
-- particulier is_justified.
CREATE OR REPLACE FUNCTION guard_absence_parent_update()
RETURNS TRIGGER AS $$
BEGIN
  IF current_parent_id() IS NOT NULL THEN
    IF NEW.is_justified IS DISTINCT FROM OLD.is_justified
       OR NEW.school_id IS DISTINCT FROM OLD.school_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.class_id IS DISTINCT FROM OLD.class_id
       OR NEW.absence_date IS DISTINCT FROM OLD.absence_date
       OR NEW.parent_notified IS DISTINCT FROM OLD.parent_notified
       OR NEW.justification_status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Un parent ne peut que soumettre un motif de justification (statut "pending").';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER absences_parent_update_guard
  BEFORE UPDATE ON absences
  FOR EACH ROW
  EXECUTE FUNCTION guard_absence_parent_update();

-- Résout students.id du compte élève connecté (accès lecture seule à son
-- propre dossier).
CREATE OR REPLACE FUNCTION current_student_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM students WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
$$;

-- Résout l'école de l'élève connecté. Utilisée uniquement pour les
-- données de référence non sensibles (classes, matières, périodes).
CREATE OR REPLACE FUNCTION current_student_school_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT school_id FROM students WHERE user_id = auth.uid() AND status = 'active' LIMIT 1;
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
CREATE POLICY "School isolation: education_cycles"
  ON education_cycles FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: education_levels"
  ON education_levels FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: ai_usage"
  ON ai_usage FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

-- Incrémentation atomique avec vérification de seuil en une seule
-- opération (voir migration 0023 pour le détail du raisonnement).
CREATE OR REPLACE FUNCTION consume_ai_quota(target_school_id UUID, daily_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  result_count INTEGER;
BEGIN
  INSERT INTO ai_usage (school_id, usage_date, count)
  VALUES (target_school_id, CURRENT_DATE, 1)
  ON CONFLICT (school_id, usage_date)
  DO UPDATE SET count = ai_usage.count + 1
  WHERE ai_usage.count < daily_limit
  RETURNING count INTO result_count;

  RETURN result_count IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
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
-- Gestion des comptes parents et de leurs liens avec les élèves :
-- réservée au personnel de l'école (director/teacher), comme teachers.
CREATE POLICY "School isolation: parents"
  ON parents FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: parent_students"
  ON parent_students FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
-- Un parent peut lire sa propre fiche et la liste de ses enfants liés,
-- mais jamais les modifier depuis son propre compte.
CREATE POLICY "Parent self read: parents"
  ON parents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Parent self read: parent_students"
  ON parent_students FOR SELECT TO authenticated
  USING (parent_id = current_parent_id());
-- Un parent peut lire uniquement les fiches de ses propres enfants (pas
-- toute l'école comme un enseignant).
CREATE POLICY "Parent read own children: students"
  ON students FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = students.id
    )
  );
-- Un élève peut lire sa propre fiche, jamais la modifier depuis son
-- propre compte.
CREATE POLICY "Student self read: students"
  ON students FOR SELECT TO authenticated
  USING (id = current_student_id());
CREATE POLICY "School isolation: fee_structures"
  ON fee_structures FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children classes fees: fee_structures"
  ON fee_structures FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = fee_structures.class_id
    )
  );
CREATE POLICY "School isolation: fee_payments"
  ON fee_payments FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children: fee_payments"
  ON fee_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = fee_payments.student_id
    )
  );
-- La lecture des notes reste scopée uniquement à l'école (un enseignant
-- peut consulter le dossier complet d'un élève). L'écriture est en plus
-- restreinte à l'affectation de l'enseignant via teacher_subjects — le
-- directeur n'est jamais concerné par cette restriction supplémentaire.
CREATE POLICY "School isolation: grades select"
  ON grades FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "Parent read own children: grades"
  ON grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = grades.student_id
    )
  );
CREATE POLICY "Student read own: grades"
  ON grades FOR SELECT TO authenticated
  USING (student_id = current_student_id());
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
CREATE POLICY "Parent read school reference: grade_types"
  ON grade_types FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: grade_types"
  ON grade_types FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

-- Emploi du temps : lecture pour tout le personnel de l'école, écriture
-- réservée au directeur (voir supabase/migrations/0012_timetable.sql).
CREATE POLICY "School isolation: timetable_slots select"
  ON timetable_slots FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "Director manage: timetable_slots insert"
  ON timetable_slots FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Director manage: timetable_slots update"
  ON timetable_slots FOR UPDATE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Director manage: timetable_slots delete"
  ON timetable_slots FOR DELETE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Parent read own children classes: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = timetable_slots.class_id
        AND s.school_id = timetable_slots.school_id
    )
  );
CREATE POLICY "Student read own class: timetable_slots"
  ON timetable_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = timetable_slots.class_id
        AND s.school_id = timetable_slots.school_id
    )
  );

-- Annonces : lecture pour tout le monde dans l'école, écriture réservée
-- au directeur (voir supabase/migrations/0013_announcements.sql).
CREATE POLICY "School isolation: announcements select"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "Director manage: announcements insert"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Director manage: announcements update"
  ON announcements FOR UPDATE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Director manage: announcements delete"
  ON announcements FOR DELETE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Parent read school reference: announcements"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: announcements"
  ON announcements FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

-- Messagerie : le personnel voit/écrit sur le fil de n'importe quel élève
-- de son école, un parent seulement sur celui de ses propres enfants
-- (voir supabase/migrations/0014_messages.sql).
CREATE POLICY "School isolation: messages select"
  ON messages FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "Staff write: messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND sender_role = 'staff'
    AND sender_teacher_id = current_teacher_id()
  );
CREATE POLICY "Parent read own children: messages"
  ON messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = messages.student_id
        AND s.school_id = messages.school_id
    )
  );
CREATE POLICY "Parent write own children: messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_role = 'parent'
    AND sender_parent_id = current_parent_id()
    AND EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = messages.student_id
    )
  );

-- Discipline : le personnel gère les sanctions de n'importe quel élève de
-- son école ; parent/élève lisent seulement les leurs.
CREATE POLICY "School isolation: disciplinary_records"
  ON disciplinary_records FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN students s ON s.id = ps.student_id
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = disciplinary_records.student_id
        AND s.school_id = disciplinary_records.school_id
    )
  );
CREATE POLICY "Student read own: disciplinary_records"
  ON disciplinary_records FOR SELECT TO authenticated
  USING (
    student_id = current_student_id()
    AND EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = disciplinary_records.student_id
        AND s.school_id = disciplinary_records.school_id
    )
  );

-- Cahier de textes : écriture restreinte comme pour les notes (un
-- enseignant ne peut écrire que sur ses classes/matières affectées),
-- lecture ouverte à tout le personnel et à la classe concernée pour
-- parents/élèves.
CREATE POLICY "School isolation: lesson_logs select"
  ON lesson_logs FOR SELECT TO authenticated
  USING (school_id = current_school_id());
CREATE POLICY "School isolation: lesson_logs insert"
  ON lesson_logs FOR INSERT TO authenticated
  WITH CHECK (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = lesson_logs.class_id
          AND ts.subject_id = lesson_logs.subject_id
      )
    )
  );
CREATE POLICY "School isolation: lesson_logs delete"
  ON lesson_logs FOR DELETE TO authenticated
  USING (
    school_id = current_school_id()
    AND (
      current_teacher_role() = 'director'
      OR EXISTS (
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = current_teacher_id()
          AND ts.class_id = lesson_logs.class_id
          AND ts.subject_id = lesson_logs.subject_id
      )
    )
  );
CREATE POLICY "Parent read own children classes: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN parent_students ps ON ps.student_id = s.id
      WHERE ps.parent_id = current_parent_id()
        AND s.class_id = lesson_logs.class_id
        AND s.school_id = lesson_logs.school_id
    )
  );
CREATE POLICY "Student read own class: lesson_logs"
  ON lesson_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = current_student_id()
        AND s.class_id = lesson_logs.class_id
        AND s.school_id = lesson_logs.school_id
    )
  );

-- Services optionnels : gestion réservée au directeur (comme la
-- scolarité), lecture pour les parents/élève concernés.
CREATE POLICY "School isolation: service_subscriptions"
  ON service_subscriptions FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: service_payments"
  ON service_payments FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children: service_subscriptions"
  ON service_subscriptions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = service_subscriptions.student_id
    )
  );
CREATE POLICY "Parent read own children: service_payments"
  ON service_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_subscriptions ss
      JOIN parent_students ps ON ps.student_id = ss.student_id
      WHERE ss.id = service_payments.subscription_id
        AND ps.parent_id = current_parent_id()
    )
  );
CREATE POLICY "Student read own: service_subscriptions"
  ON service_subscriptions FOR SELECT TO authenticated
  USING (student_id = current_student_id());
CREATE POLICY "Student read own: service_payments"
  ON service_payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_subscriptions ss
      WHERE ss.id = service_payments.subscription_id
        AND ss.student_id = current_student_id()
    )
  );

-- Personnel & Paie : directeur uniquement, y compris au niveau RLS (pas
-- seulement applicatif) — une fuite de salaire vers un collègue
-- enseignant serait un vrai problème, pas juste une gêne d'UI.
CREATE POLICY "Director only: staff_members"
  ON staff_members FOR ALL TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
CREATE POLICY "Director only: payroll_payments"
  ON payroll_payments FOR ALL TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

-- Salles : purement interne au personnel.
CREATE POLICY "School isolation: rooms"
  ON rooms FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: room_bookings"
  ON room_bookings FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: bulletin_appreciations"
  ON bulletin_appreciations FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children: bulletin_appreciations"
  ON bulletin_appreciations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = bulletin_appreciations.student_id
    )
  );
CREATE POLICY "Student read own: bulletin_appreciations"
  ON bulletin_appreciations FOR SELECT TO authenticated
  USING (student_id = current_student_id());
CREATE POLICY "School isolation: audit_log"
  ON audit_log FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "School isolation: absences"
  ON absences FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
CREATE POLICY "Parent read own children: absences"
  ON absences FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  );
-- Un parent peut soumettre un motif de justification pour l'absence de
-- son enfant (mais pas se l'auto-approuver, voir le trigger
-- guard_absence_parent_update ci-dessus).
CREATE POLICY "Parent submit justification: absences"
  ON absences FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = absences.student_id
    )
  );
CREATE POLICY "Student read own: absences"
  ON absences FOR SELECT TO authenticated
  USING (student_id = current_student_id());

-- Données de référence non sensibles : lecture au niveau école pour un
-- parent ou un élève (noms de classes/matières/périodes, nécessaires
-- pour afficher notes et bulletins).
CREATE POLICY "Parent read school reference: classes"
  ON classes FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: classes"
  ON classes FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: education_cycles"
  ON education_cycles FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: education_cycles"
  ON education_cycles FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: education_levels"
  ON education_levels FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: education_levels"
  ON education_levels FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: subjects"
  ON subjects FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: subjects"
  ON subjects FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: class_subjects"
  ON class_subjects FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: class_subjects"
  ON class_subjects FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: school_years"
  ON school_years FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: school_years"
  ON school_years FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());
CREATE POLICY "Parent read school reference: periods"
  ON periods FOR SELECT TO authenticated
  USING (school_id = current_parent_school_id());
CREATE POLICY "Student read school reference: periods"
  ON periods FOR SELECT TO authenticated
  USING (school_id = current_student_school_id());

CREATE TRIGGER teachers_privileged_fields_guard
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION guard_teacher_privileged_fields();
