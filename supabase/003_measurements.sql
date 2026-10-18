-- Migration: weight tracking -> body measurements
-- Run this in the Supabase SQL Editor. Keeps existing weight entries (their
-- circumference/time columns stay NULL; the app requires them for new entries).

ALTER TABLE weight_entries RENAME TO measurement_entries;
ALTER TABLE measurement_entries DROP CONSTRAINT IF EXISTS weight_entries_date_key;  -- allow several per day
ALTER INDEX idx_weight_date RENAME TO idx_measurements_date;
ALTER POLICY "Allow all on weight_entries" ON measurement_entries RENAME TO "Allow all on measurement_entries";

ALTER TABLE measurement_entries
  ADD COLUMN time TIME,
  ADD COLUMN calf_left_cm NUMERIC(5,1),
  ADD COLUMN calf_right_cm NUMERIC(5,1),
  ADD COLUMN quad_left_cm NUMERIC(5,1),
  ADD COLUMN quad_right_cm NUMERIC(5,1),
  ADD COLUMN arm_left_cm NUMERIC(5,1),
  ADD COLUMN arm_right_cm NUMERIC(5,1),
  ADD COLUMN stomach_cm NUMERIC(5,1),
  ADD COLUMN chest_cm NUMERIC(5,1);
