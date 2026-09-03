-- Gestion des salles comme ressource réservable : distinct de
-- timetable_slots.room (texte libre, cours récurrents hebdomadaires) —
-- ceci couvre les réservations ponctuelles (réunion, conseil de classe,
-- labo informatique un après-midi...). Purement interne au personnel :
-- pas de policy parent/élève, contrairement au reste du schéma.
--
-- À exécuter dans le SQL Editor Supabase, après 0019_optional_services.sql.

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

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School isolation: rooms"
  ON rooms FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "School isolation: room_bookings"
  ON room_bookings FOR ALL TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());
