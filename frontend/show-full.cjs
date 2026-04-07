
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wdawnbxrafqggmcwhamz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXduYnhyYWZxZ2dtY3doYW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc3NjQ0NywiZXhwIjoyMDg1MzUyNDQ3fQ.bVD2z4TI6boL_IGJaCfet7Ydz9ewK9rmcKhxNf7EMgg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function showFullAttendance() {
  console.log('\n📊 FULL ATTENDANCE RECORDS\n');
  console.log('='.repeat(80));

  const { data: attendance, error } = await supabase
    .from('attendance')
    .select('*, students(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log(`Total Records: ${attendance?.length || 0}\n`);
  
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
      console.log(`  ${time} | ${name} | ${r.status} | ${Math.round(r.confidence)}%`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

showFullAttendance();

