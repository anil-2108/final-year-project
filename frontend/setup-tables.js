
// Supabase Table Setup Script
// Run this to create the required tables in your Supabase project

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wdawnbxrafqggmcwhamz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WH-g7YRRHvS8h2XZLO5pzQ_axkC5FX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Setting up Supabase tables...\n');

  // Create students table
  const { error: studentsError } = await supabase.rpc('create_students_table', { 
    sql: `
      CREATE TABLE IF NOT EXISTS students (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        email text UNIQUE,
        face_encoding text,
        created_at timestamptz DEFAULT now()
      );
    `
  }).catch(() => null);

  // Try direct table creation via SQL
  const { error: studentsError2 } = await supabase.from('students').select('*').limit(1).catch(() => ({ error: null }));

  console.log('Checking students table...');
  
  // Create attendance table
  const { error: attendanceError } = await supabase.from('attendance').select('*').limit(1).catch(() => ({ error: null }));
  
  console.log('Checking attendance table...');

  // Try inserting test data to see if tables work
  console.log('\nTesting table access...');
  
  // Check students
  const { data: students, error: studentsListError } = await supabase.from('students').select('*');
  console.log('Students table accessible:', !studentsListError);
  console.log('Current students:', students?.length || 0);

  // Check attendance
  const { data: attendance, error: attendanceListError } = await supabase.from('attendance').select('*');
  console.log('Attendance table accessible:', !attendanceListError);
  console.log('Current attendance records:', attendance?.length || 0);

  if (studentsListError || attendanceListError) {
    console.log('\n❌ Tables may not exist. Please run the SQL migration in Supabase Dashboard:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/wdawnbxrafqggmcwhamz/sql-editor');
    console.log('2. Run the SQL from: supabase/migrations/20260130110455_create_attendance_table.sql');
    console.log('3. Also ensure students table exists:\n');
    console.log(`CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  face_encoding text,
  created_at timestamptz DEFAULT now()
);`);
  } else {
    console.log('\n✅ Tables are accessible!');
  }
}

setupTables().catch(console.error);

