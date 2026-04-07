-- Add session tracking columns to attendance table
-- This enables tracking of start time, end time, total time, alert time, and alertness percentage

-- Add new columns to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS start_time timestamptz;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS end_time timestamptz;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS total_time integer DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS alert_time integer DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS alertness numeric DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session_id text;

-- Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);

-- Drop old RLS policies and recreate with new columns
DROP POLICY IF EXISTS "Allow public read access to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public update to attendance" ON attendance;

CREATE POLICY "Allow public read access to attendance"
  ON attendance FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to attendance"
  ON attendance FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to attendance"
  ON attendance FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Create sessions table for managing attendance sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions table
CREATE POLICY "Allow public read access to sessions"
  ON sessions FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to sessions"
  ON sessions FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to sessions"
  ON sessions FOR UPDATE TO public USING (true) WITH CHECK (true);

