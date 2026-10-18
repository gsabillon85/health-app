-- Migration: per-set exercise tracking
-- Run this in the Supabase SQL Editor. WIPES all existing exercise data.

DROP TABLE IF EXISTS exercise_sets;
DROP TABLE IF EXISTS exercise_entries;

-- One row per exercise performed (e.g. "Bench Press" on a given day)
CREATE TABLE exercise_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per set within an exercise
-- weight_amount + weight_unit covers both "60 kg" and "4 rings" / "3 medicine balls"
CREATE TABLE exercise_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES exercise_entries(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight_amount NUMERIC(6,2),
  weight_unit TEXT DEFAULT 'kg',
  reps INTEGER CHECK (reps >= 0),
  duration_sec INTEGER CHECK (duration_sec >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exercise_id, set_number)
);

ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on exercise_entries" ON exercise_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_exercises_date ON exercise_entries(date DESC);
CREATE INDEX idx_exercise_sets_exercise ON exercise_sets(exercise_id);
