-- École
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'starter'
    CHECK (plan IN ('starter','school','premium')),
  plan_expires_at TIMESTAMPTZ,
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

-- Enseignants
CREATE TABLE teachers (
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
  trimester INTEGER CHECK (trimester IN (1,2,3)),
  score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, subject_id,
         school_year_id, trimester)
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
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth access schools"
  ON schools FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access school_years"
  ON school_years FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access classes"
  ON classes FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access subjects"
  ON subjects FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access teachers"
  ON teachers FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access students"
  ON students FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access fee_structures"
  ON fee_structures FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access fee_payments"
  ON fee_payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access grades"
  ON grades FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth access absences"
  ON absences FOR ALL TO authenticated USING (true);
