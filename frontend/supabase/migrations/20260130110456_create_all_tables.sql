
-- Complete database setup for Smart Attendance System
-- Run this SQL in Supabase SQL Editor

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  face_encoding text,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text DEFAULT 'present',
  confidence numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Allow public read access to students"
  ON students FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to students"
  ON students FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to students"
  ON students FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Create policies for attendance table
CREATE POLICY "Allow public read access to attendance"
  ON attendance FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert to attendance"
  ON attendance FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update to attendance"
  ON attendance FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Insert sample students (uncomment and modify as needed)
-- INSERT INTO students (name, email, face_encoding) VALUES 
-- ('John Doe', 'john@example.com', '[0.1, 0.2, 0.3, ...]'),
-- ('Jane Smith', 'jane@example.com', '[0.2, 0.3, 0.4, ...]');


