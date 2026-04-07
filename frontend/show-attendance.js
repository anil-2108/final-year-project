
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wdawnbxrafqggmcwhamz.supabase.co';
const serviceRoleKey = 'sb_secret_gDsmKvqWOv2f8S-oWRFDEw_uL54zbJt';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function showFullAttendance() {
  console.log('\n📊 FULL ATTENDANCE RECORDS\n');
  console.log('═'.repeat(80));

  // Get all attendance with student info
  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('*, students(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log(`Total Records: ${attendance?.length || 0}\n`);
  
  // Group by date
  const grouped = {};
  attendance?.forEach(record => {
    const date = new Date(record.created_at).toLocaleDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(record);
  });

  for (const [date, records] of Object.entries(grouped)) {
    console.log(`\n📅 ${date} (${records.length} records)`);
    console.log('-'.repeat(60));
    
    records.forEach(r => {
      const name = r.students?.name || 'Unknown';
      const time = new Date(r.created_at).toLocaleTimeString();
      console.log(`  🕐 ${time.padEnd(10)} | ${name.padEnd(20)} | ${r.status.toUpperCase().padEnd(8)} | ${Math.round(r.confidence)}%`);
    });
  }

  console.log('\n' + '═'.repeat(80));
  
  // Summary
  console.log('\n📈 SUMMARY:');
  const { data: students } = await supabase.from('students').select('id, name');
  console.log(`Total Students: ${students?.length || 0}`);
  console.log(`Total Attendance Records: ${attendance?.length || 0}`);
}

showFullAttendance();

