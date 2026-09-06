-- Décision du conseil de classe (passage / redoublement / passage
-- conditionnel) : absente du modèle scolaire jusqu'ici, alors qu'un vrai
-- bulletin de fin d'année secondaire l'affiche toujours. Une ligne par
-- élève et par année scolaire (pas par trimestre : c'est une décision
-- annuelle, prise une fois, généralement après le 3e trimestre).
--
-- Décision sensible (détermine si l'élève redouble) : seul le directeur
-- peut l'écrire, sur le modèle déjà posé pour staff_members/
-- payroll_payments (0024_payroll.sql) — restriction directement dans la
-- policy plutôt que côté application seulement. La lecture reste ouverte à
-- tout le personnel de l'école (un enseignant qui imprime le bulletin
-- final d'un élève doit pouvoir voir la décision déjà prise), ainsi qu'au
-- parent et à l'élève concernés, comme bulletin_appreciations.

CREATE TABLE class_council_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id)
    ON DELETE CASCADE,
  student_id UUID REFERENCES students(id)
    ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id)
    ON DELETE CASCADE,
  decision TEXT CHECK (decision IN ('passage', 'redoublement', 'passage_conditionnel')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, school_year_id)
);

ALTER TABLE class_council_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School isolation read: class_council_decisions"
  ON class_council_decisions FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "Director insert: class_council_decisions"
  ON class_council_decisions FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director update: class_council_decisions"
  ON class_council_decisions FOR UPDATE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director')
  WITH CHECK (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Director delete: class_council_decisions"
  ON class_council_decisions FOR DELETE TO authenticated
  USING (school_id = current_school_id() AND current_teacher_role() = 'director');

CREATE POLICY "Parent read own children: class_council_decisions"
  ON class_council_decisions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = current_parent_id()
        AND ps.student_id = class_council_decisions.student_id
    )
  );

CREATE POLICY "Student read own: class_council_decisions"
  ON class_council_decisions FOR SELECT TO authenticated
  USING (student_id = current_student_id());
