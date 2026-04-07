import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AttendanceRecord {
  id: string;
  status: string;
  confidence: number;
  created_at: string;
  student_id: string;
  start_time: string | null;
  end_time: string | null;
  total_time: number | null;
  alert_time: number | null;
  alertness: number | null;
  session_id: string | null;
  students: {
    name: string;
  }[] | null;
}

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

export function AttendanceDashboard() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setSessions(data);
    } catch (err) {
      console.log("Sessions table not available yet");
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);

    if (!supabase) {
      setError("Supabase is not configured. Please check your credentials.");
      setLoading(false);
      return;
    }

    console.log("Fetching attendance data...");
    
    // First get all attendance records
    const { data: attendanceData, error } = await supabase
      .from("attendance")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    console.log("Attendance data:", { data: attendanceData, error });

    if (error) {
      console.error("Error fetching attendance:", error);
      setError(`Error: ${error.message}`);
      setRecords([]);
      setLoading(false);
      return;
    }
    
    // If we have records, fetch the student names separately
    if (attendanceData && attendanceData.length > 0) {
      // Get unique student IDs
      const studentIds = [...new Set(attendanceData.map(r => r.student_id).filter(Boolean))];
      
      if (studentIds.length > 0) {
        const { data: studentsData } = await supabase
          .from("students")
          .select("id, name")
          .in("id", studentIds);
        
        // Create a map of student ID to name
        const studentMap = new Map();
        studentsData?.forEach(s => studentMap.set(s.id, s.name));
        
        // Combine attendance with student names
        const recordsWithNames = attendanceData.map(r => ({
          ...r,
          students: studentMap.get(r.student_id) ? [{ name: studentMap.get(r.student_id) }] : null
        }));
        
        setRecords(recordsWithNames as AttendanceRecord[]);
      } else {
        setRecords(attendanceData as AttendanceRecord[]);
      }
    } else {
      setRecords([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedSession]);

  // Format time in milliseconds to readable format (HH:MM:SS)
  const formatTime = (ms: number | null): string => {
    if (ms === null || ms === 0) return "0:00";
    // Convert milliseconds to seconds
    const seconds = Math.floor(ms / 1000);
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format timestamp to readable time
  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format timestamp to readable date/time
  const formatDateTime = (timestamp: string | null): string => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">📊 Attendance Records</h2>

      {/* Session Filter */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="font-medium">Filter by Session:</label>
        <select
          value={selectedSession || ""}
          onChange={(e) => setSelectedSession(e.target.value || null)}
          className="border p-2 rounded"
        >
          <option value="">All Sessions</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name} ({session.status})
            </option>
          ))}
        </select>

        <button
          onClick={fetchAttendance}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <p className="text-gray-500">No attendance records found.</p>
      )}

      {records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Start Time</th>
                <th className="border p-2">End Time</th>
                <th className="border p-2">Total Time</th>
                <th className="border p-2">Alert Time</th>
                <th className="border p-2">Alertness</th>
                <th className="border p-2">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="border p-2 font-medium">
                    {r.students?.[0]?.name ?? "Unknown"}
                  </td>
                  <td className="border p-2">
                    {formatTimestamp(r.start_time)}
                  </td>
                  <td className="border p-2">
                    {formatTimestamp(r.end_time)}
                  </td>
                  <td className="border p-2">
                    {formatTime(r.total_time)}
                  </td>
                  <td className="border p-2">
                    {formatTime(r.alert_time)}
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (r.alertness || 0) >= 60 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${r.alertness || 0}%` }}
                        />
                      </div>
                      <span>{r.alertness ?? 0}%</span>
                    </div>
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      r.status === 'present' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {r.status === 'present' ? '✅ Present' : '❌ Absent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {records.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Session Summary</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Students:</span>{" "}
              <span className="font-bold">{records.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Present:</span>{" "}
              <span className="font-bold text-green-600">
                {records.filter(r => r.status === 'present').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Absent:</span>{" "}
              <span className="font-bold text-red-600">
                {records.filter(r => r.status === 'absent').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Avg Alertness:</span>{" "}
              <span className="font-bold">
                {Math.round(records.reduce((sum, r) => sum + (r.alertness || 0), 0) / records.length)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

