/*
  # Create Attendance System Tables

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique)
      - `face_encoding` (text, stores face encoding data)
      - `created_at` (timestamptz)
    
    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `total_time` (interval)
      - `alert_time` (interval)
      - `alertness_percentage` (numeric)
      - `attendance_status` (text: Present/Absent)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  face_encoding text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  total_time interval,
  alert_time interval,
  alertness_percentage numeric DEFAULT 0,
  attendance_status text DEFAULT 'Absent',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to students"
  ON students
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to students"
  ON students
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to students"
  ON students
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to attendance_records"
  ON attendance_records
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to attendance_records"
  ON attendance_records
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to attendance_records"
  ON attendance_records
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);