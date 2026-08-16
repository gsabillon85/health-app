-- Health App Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Weight tracking
CREATE TABLE weight_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
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

-- Exercise tracking
CREATE TABLE exercise_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_name TEXT NOT NULL,
  sets INTEGER DEFAULT 1,
  reps INTEGER DEFAULT 1,
  weight_kg NUMERIC(6,2) DEFAULT 0,
  duration_min INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - open access for single-user app
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;

-- Permissive policies (no auth required - personal app)
CREATE POLICY "Allow all on weight_entries" ON weight_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on meal_entries" ON meal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exercise_entries" ON exercise_entries FOR ALL USING (true) WITH CHECK (true);

-- Indexes for date-based queries
CREATE INDEX idx_weight_date ON weight_entries(date DESC);
CREATE INDEX idx_meals_date ON meal_entries(date DESC);
CREATE INDEX idx_exercises_date ON exercise_entries(date DESC);
