import { supabase, AttendanceRecord } from '../lib/supabase';

export async function startAttendanceSession(studentId: string) {
  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      student_id: studentId,
      start_time: new Date().toISOString(),
      attendance_status: 'Present',
      alertness_percentage: 0,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error starting attendance session:', error);
    return null;
  }

  return data;
}

export async function updateAttendanceSession(
  recordId: string,
  alertnessPercentage: number,
  alertTime: string
) {
  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      alertness_percentage: alertnessPercentage,
      alert_time: alertTime,
      end_time: new Date().toISOString(),
    })
    .eq('id', recordId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating attendance session:', error);
    return null;
  }

  return data;
}

export async function getAttendanceRecords() {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      students (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }

  return data;
}

export function exportToCSV(records: any[]) {
  if (records.length === 0) return;

  const headers = ['Name', 'Start Time', 'End Time', 'Total Time', 'Alert Time', 'Alertness', 'Attendance'];

  const csvData = records.map(record => {
    const startTime = new Date(record.start_time);
    const endTime = record.end_time ? new Date(record.end_time) : new Date();
    const totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    return [
      record.students?.name || 'Unknown',
      startTime.toLocaleString(),
      endTime.toLocaleString(),
      `${totalMinutes} min`,
      record.alert_time || '0 min',
      `${Math.round(record.alertness_percentage)}%`,
      record.attendance_status,
    ].join(',');
  });

  const csv = [headers.join(','), ...csvData].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function calculateTotalTime(startTime: string, endTime: string | null): string {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}