import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdawnbxrafqggmcwhamz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXduYnhyYWZxZ2dtY3doYW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc3NjQ0NywiZXhwIjoyMDg1MzUyNDQ3fQ.bVD2z4TI6boL_IGJaCfet7Ydz9ewK9rmcKhxNf7EMgg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkData() {
  console.log('🔍 Checking database...\n');

  // Check students with face encoding
  const { data: allStudents, error: listError } = await supabase
    .from('students')
    .select('id, name, email, face_encoding');

  if (listError) {
    console.log('Error fetching students:', listError.message);
  } else {
    console.log('📋 Registered Students:', allStudents?.length || 0);
    let withFace = 0;
    if (allStudents && allStudents.length > 0) {
      allStudents.forEach(s => {
        const hasFace = s.face_encoding ? '✅' : '❌';
        if (s.face_encoding) withFace++;
        console.log(`  - ${s.name} ${hasFace}`);
      });
    }
    console.log(`\nStudents with face data: ${withFace}/${allStudents?.length || 0}`);
  }

  // Check attendance records
  const { data: attendanceRecords, error: attError } = await supabase
    .from('attendance')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (attError) {
    console.log('\nError fetching attendance:', attError.message);
  } else {
    console.log('\n📊 Recent Attendance Records:', attendanceRecords?.length || 0);
    if (attendanceRecords && attendanceRecords.length > 0) {
      attendanceRecords.forEach(a => {
        console.log(`  - Student ID: ${a.student_id}, Status: ${a.status}, Confidence: ${a.confidence}%, Time: ${new Date(a.created_at).toLocaleString()}`);
      });
    }
  }
}

checkData();

