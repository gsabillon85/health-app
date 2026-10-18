-- Health App Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Body measurements (several per day allowed). Circumferences in cm, measured
-- at: calf, quadricep, upper arm (bicep/tricep), stomach at the belly button,
-- chest at nipple height.
CREATE TABLE measurement_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME,
  weight_kg NUMERIC(5,2) NOT NULL,
  calf_left_cm NUMERIC(5,1),
  calf_right_cm NUMERIC(5,1),
  quad_left_cm NUMERIC(5,1),
  quad_right_cm NUMERIC(5,1),
  arm_left_cm NUMERIC(5,1),
  arm_right_cm NUMERIC(5,1),
  stomach_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal tracking
CREATE TABLE meal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('meal', 'snack')),
  food_items JSONB NOT NULL DEFAULT '[]',
  total_weight_g NUMERIC(7,1) DEFAULT 0,
  total_calories NUMERIC(7,1) DEFAULT 0,
  total_protein_g NUMERIC(6,1) DEFAULT 0,
  total_carbs_g NUMERIC(6,1) DEFAULT 0,
  total_fat_g NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise tracking: one row per exercise, one row per set
CREATE TABLE exercise_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Enable RLS (Row Level Security) - open access for single-user app
ALTER TABLE measurement_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Permissive policies (no auth required - personal app)
CREATE POLICY "Allow all on measurement_entries" ON measurement_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meal_entries" ON meal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_entries" ON exercise_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_sets" ON exercise_sets FOR ALL USING (true) WITH CHECK (true);

-- Indexes for date-based queries
CREATE INDEX idx_measurements_date ON measurement_entries(date DESC);
CREATE INDEX idx_meals_date ON meal_entries(date DESC);
CREATE INDEX idx_exercises_date ON exercise_entries(date DESC);
CREATE INDEX idx_exercise_sets_exercise ON exercise_sets(exercise_id);
