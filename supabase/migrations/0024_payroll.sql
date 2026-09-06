-- Personnel & Paie : suivi des salaires versés au personnel de l'école
-- (enseignants ET non-enseignants — comptable, gardien, agent
-- d'entretien...). Module séparé de la scolarité (fee_payments) et des
-- services (service_payments) : ceux-là suivent l'argent REÇU des
-- familles, celui-ci l'argent VERSÉ par l'école — un flux inverse, pas
-- une variante du même modèle.
--
-- `teachers` ne couvre pas le personnel non-enseignant, d'où une table de
-- référence à part (`staff_members`) plutôt que d'étendre `teachers`.
-- Un membre du personnel qui est aussi un compte enseignant peut être lié
-- via `teacher_id` (évite de ressaisir son nom/téléphone) sans que ce
-- lien soit obligatoire.
--
-- Données sensibles (montants de salaire) : contrairement à
-- classes/subjects/grade_types (ouverts en écriture à tout le personnel
-- au niveau RLS, restreints seulement côté application), ici la
-- restriction "directeur uniquement" est posée directement dans la
-- policy — une fuite de salaire vers un collègue enseignant serait un
-- vrai problème, pas seulement une gêne d'UI.
--
-- À exécuter dans le SQL Editor Supabase, après 0023_ai_usage_quota.sql.

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
  period_month DATE NOT NULL, -- premier jour du mois payé, comme service_payments.period_month
  payment_method TEXT DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'orange_money', 'moov_money', 'transfer')),
  note TEXT, -- ex. "avance sur salaire", "prime de fin d'année"
  receipt_number TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Réutilise generate_receipt_number(), déjà générique (fee_payments,
-- service_payments), plutôt que d'en dupliquer une.
CREATE TRIGGER set_payroll_receipt_number
  BEFORE INSERT ON payroll_payments
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL OR NEW.receipt_number = '')
  EXECUTE FUNCTION generate_receipt_number();

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Director only: staff_members"
  ON staff_members FOR ALL TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director only: payroll_payments"
  ON payroll_payments FOR ALL TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');
