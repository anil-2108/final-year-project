-- Create attendance table that matches the frontend code expectations
-- This table stores individual attendance records with face recognition confidence

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text DEFAULT 'present',
  confidence numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to attendance"
  ON attendance
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to attendance"
  ON attendance
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to attendance"
  ON attendance
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);

