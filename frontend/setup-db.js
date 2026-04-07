import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdawnbxrafqggmcwhamz.supabase.co';
const serviceRoleKey = 'sb_secret_gDsmKvqWOv2f8S-oWRFDEw_uL54zbJt';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('Setting up attendance table...');

  // Create attendance table
  const { error: createError } = await supabase.rpc('create_attendance_table', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS attendance (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id uuid REFERENCES students(id) ON DELETE CASCADE,
        status text DEFAULT 'present',
        confidence numeric DEFAULT 0,
        created_at timestamptz DEFAULT now()
      );
    `
  });

  if (createError) {
    console.log('Trying direct table creation...');
  }

  // Try alternative: Execute raw SQL via postgrest
  try {
    // Check if students table exists
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);

    console.log('Students table check:', studentsError ? 'Error: ' + studentsError.message : 'OK');
    
    // Check if attendance table exists
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(1);

    console.log('Attendance table check:', attendanceError ? 'Error: ' + attendanceError.message : 'OK');

    if (attendanceError && attendanceError.code === '42P01') {
      console.log('\n⚠️ Attendance table does not exist!');
      console.log('Please run the following SQL in your Supabase SQL Editor:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text DEFAULT 'present',
  confidence numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to attendance" ON attendance FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert to attendance" ON attendance FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update to attendance" ON attendance FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
      `);
    }

    // List existing students
    const { data: allStudents, error: listError } = await supabase
      .from('students')
      .select('id, name, email');

    if (listError) {
      console.log('Error fetching students:', listError.message);
    } else {
      console.log('\n📋 Registered Students:', allStudents?.length || 0);
      if (allStudents && allStudents.length > 0) {
        allStudents.forEach(s => console.log(`  - ${s.name} (${s.email || 'no email'})`));
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

setupDatabase();

