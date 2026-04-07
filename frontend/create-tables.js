
// Direct Supabase Setup - Creates tables using REST API
const SUPABASE_URL = 'https://wdawnbxrafqggmcwhamz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WH-g7YRRHvS8h2XZLO5pzQ_axkC5FX4';

async function createTables() {
  console.log('🔧 Setting up Supabase tables...\n');
  
  // SQL to create tables
  const createStudentsSQL = `
    CREATE TABLE IF NOT EXISTS students (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text UNIQUE,
      face_encoding text,
      created_at timestamptz DEFAULT now()
    );
  `;
  
  const createAttendanceSQL = `
    CREATE TABLE IF NOT EXISTS attendance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id uuid REFERENCES students(id) ON DELETE CASCADE,
      status text DEFAULT 'present',
      confidence numeric DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
  `;
  
  const enableRLSSQL = `
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
  `;
  
  const policiesSQL = `
    CREATE POLICY "Allow public access to students" ON students FOR ALL TO public USING (true) WITH CHECK (true);
    CREATE POLICY "Allow public access to attendance" ON attendance FOR ALL TO public USING (true) WITH CHECK (true);
  `;
  
  const indexesSQL = `
    CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
  `;

  // Using fetch to call Supabase REST API
  async function executeSQL(sql) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!response.ok) {
        // Try alternative approach - direct table creation
        console.log('Trying alternative method...');
        return false;
      }
      return true;
    } catch (e) {
      console.log('RPC not available, will try direct table check');
      return false;
    }
  }
  
  // Check if tables exist by trying to query them
  async function checkTable(tableName) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  console.log('Checking existing tables...');
  const studentsExists = await checkTable('students');
  const attendanceExists = await checkTable('attendance');
  
  console.log(`Students table: ${studentsExists ? '✅ EXISTS' : '❌ MISSING'}`);
  console.log(`Attendance table: ${attendanceExists ? '✅ EXISTS' : '❌ MISSING'}\n`);
  
  if (!studentsExists || !attendanceExists) {
    console.log('⚠️ Tables need to be created.');
    console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/wdawnbxrafqggmcwhamz/sql-editor\n');
    console.log(copySQL);
    process.exit(1);
  }
  
  console.log('✅ All tables are set up correctly!');
  console.log('\n🚀 Now run: npm run dev');
}

const copySQL = `
-- Run in Supabase SQL Editor:

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

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public access to students" ON students FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to attendance" ON attendance FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
`;

createTables();

