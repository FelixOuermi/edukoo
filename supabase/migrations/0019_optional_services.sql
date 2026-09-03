-- Services optionnels (cantine, transport) : contrairement à la
-- scolarité (fee_structures s'applique à toute la classe), ce sont des
-- services auxquels un élève souscrit individuellement — d'où un modèle
-- séparé plutôt qu'une simple catégorie sur fee_structures, qui
-- supposerait à tort que tous les élèves d'une classe y participent.
--
-- Un seul couple de tables pour les deux services (discriminant
-- service_type) plutôt que quatre tables quasi identiques.
--
-- À exécuter dans le SQL Editor Supabase, après 0018_lesson_logs.sql.

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
  period_month DATE NOT NULL, -- premier jour du mois payé
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'transfer')),
  receipt_number TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Réutilise la même séquence/fonction que fee_payments (déjà générique :
-- ne fait que poser NEW.receipt_number) plutôt que d'en dupliquer une.
CREATE TRIGGER set_service_receipt_number
  BEFORE INSERT ON service_payments
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL OR NEW.receipt_number = '')
  EXECUTE FUNCTION generate_receipt_number();

ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_payments ENABLE ROW LEVEL SECURITY;

-- Gestion réservée au directeur (comme la scolarité), cohérent avec
-- requireDirector() côté application.
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
