import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Users, Eye, CheckCircle, XCircle, Play, Square } from "lucide-react";
import { supabase, supabaseAdmin } from "../lib/supabase";
import { detectFaces, loadModels } from "../utils/faceDetection";
import { calculateAttention } from "../utils/attentionTracking";
import * as faceapi from "face-api.js";

interface Student {
  id: string;
  name: string;
  face_encoding: string;
}

interface AttendanceMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StudentSessionData {
  studentId: string;
  name: string;
  startTime: Date | null;
  lastSeenTime: Date | null;
  totalTime: number; // in milliseconds
  alertTime: number; // in milliseconds
  attendanceId: string | null;
}

interface Session {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
}

export function LiveAttendance() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const modelsLoadedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  // Track session data per student
  const studentDataRef = useRef<Map<string, StudentSessionData>>(new Map());

  const [students, setStudents] = useState<Student[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({ detected: 0, attentive: 0, present: 0 });
  const [message, setMessage] = useState<AttendanceMessage | null>(null);
  const [lastMarkedName, setLastMarkedName] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Generate a proper UUID for session
  const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Fetch sessions from database
  const fetchSessions = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setSessions(data);
    } catch (err) {
      console.log("Sessions table not available yet");
    }
  };

  useEffect(() => {
    loadModels().then(() => {
      modelsLoadedRef.current = true;
    });

    if (!supabase) {
      console.warn("Supabase is not configured.");
      return;
    }

    supabase.from("students").select("*").then(({ data }) => {
      if (data) setStudents(data as Student[]);
    });

    fetchSessions();

    return stopMonitoring;
  }, []);

  // Start a new session
  const startSession = async () => {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Database not connected.' });
      return;
    }

    const newSessionId = generateSessionId();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        id: newSessionId,
        name: `Session ${new Date().toLocaleString()}`,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      setMessage({ type: 'error', text: `Failed to start session: ${error.message}` });
      return;
    }

    sessionIdRef.current = newSessionId;
    setCurrentSession(data);
    studentDataRef.current.clear();
    console.log("=== Session started, studentDataRef cleared ===");
    setMessage({ type: 'success', text: '✅ Session started!' });
  };

  // End the current session
  const endSession = async () => {
    console.log("Ending session...");
    
    // First stop monitoring
    stopMonitoring();
    
    if (!supabase || !sessionIdRef.current) {
      console.log("No session to end");
      return;
    }

    // Finalize all attendance records for this session
    await finalizeAllAttendance();

    // Update session status
    await supabase
      .from("sessions")
      .update({ 
        end_time: new Date().toISOString(), 
        status: 'completed' 
      })
      .eq("id", sessionIdRef.current);

    sessionIdRef.current = null;
    setCurrentSession(null);
    setMessage({ type: 'info', text: '📊 Session ended. Final attendance calculated.' });
    fetchSessions();
  };

  // Finalize all attendance records
  const finalizeAllAttendance = async () => {
    const db = supabaseAdmin || supabase;
    if (!db) {
      console.log("No database connection");
      return;
    }

    const studentData = studentDataRef.current;
    console.log("=== FINALIZE ATTENDANCE DEBUG ===");
    console.log("Student data size:", studentData.size);
    
    // Log ALL entries in the map
    for (const [studentId, studentRec] of studentData.entries()) {
      console.log("----------------------------------------");
      console.log("Student ID:", studentId);
      console.log("  name:", studentRec.name);
      console.log("  totalTime (ms):", studentRec.totalTime);
      console.log("  alertTime (ms):", studentRec.alertTime);
      console.log("  attendanceId:", studentRec.attendanceId);
      console.log("  startTime:", studentRec.startTime);
      console.log("  lastSeenTime:", studentRec.lastSeenTime);
      
      if (studentRec.attendanceId) {
        // Calculate alertness as percentage (both times are in ms)
        const alertness = studentRec.totalTime > 0 
          ? Math.round((studentRec.alertTime / studentRec.totalTime) * 100) 
          : 0;
        
        // Convert milliseconds to seconds for storage
        const totalSeconds = Math.round(studentRec.totalTime / 1000);
        const alertSeconds = Math.round(studentRec.alertTime / 1000);
        
        console.log("  FINAL UPDATE - totalSeconds:", totalSeconds, "alertSeconds:", alertSeconds, "alertness:", alertness);
        
        const { data: updateData, error } = await db
          .from("attendance")
          .update({
            end_time: studentRec.lastSeenTime?.toISOString(),
            total_time: totalSeconds,
            alert_time: alertSeconds,
            alertness: alertness,
            status: alertness >= 60 ? 'present' : 'absent'
          })
          .eq("id", studentRec.attendanceId)
          .select();
          
        console.log("  Update result - data:", JSON.stringify(updateData), "error:", error);
      }
    }
    console.log("=== END FINALIZE ===");
  };

  const startMonitoring = async () => {
    console.log("Start monitoring called", { videoRef: !!videoRef.current, modelsLoaded: modelsLoadedRef.current });
    
    if (!videoRef.current) {
      console.error("Video ref is not set");
      return;
    }
    
    if (!modelsLoadedRef.current) {
      console.error("Models not loaded yet");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      runningRef.current = true;
      lastFrameTimeRef.current = Date.now();
      setIsMonitoring(true);
      
      // Process frames at 2 second intervals (2000ms)
      frameIntervalRef.current = window.setInterval(processFrame, 2000);
    } catch (err) {
      console.error("Error starting camera:", err);
    }
  };

  const stopMonitoring = () => {
    runningRef.current = false;
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsMonitoring(false);
    setStats({ detected: 0, attentive: 0, present: 0 });
  };

  const findMatch = (descriptor: Float32Array) => {
    let best: { student: Student; dist: number } | null = null;

    for (const s of students) {
      if (!s.face_encoding) continue;
      const stored = new Float32Array(JSON.parse(s.face_encoding));
      const dist = faceapi.euclideanDistance(descriptor, stored);
      if (!best || dist < best.dist) best = { student: s, dist };
    }

    return best && best.dist < 0.6 ? best.student : null;
  };

  // Create or update attendance record for a student
  const updateAttendance = async (
    studentId: string, 
    name: string, 
    isAttentive: boolean,
    frameTimeMs: number
  ): Promise<string | null> => {
    const db = supabaseAdmin || supabase;
    if (!db || !sessionIdRef.current) {
      console.log("No DB or session - returning null");
      return null;
    }

    let studentData = studentDataRef.current.get(studentId);
    const now = new Date();
    
    // Calculate seconds for database storage
    const totalTimeSec = Math.round(frameTimeMs / 1000);
    const alertTimeSec = isAttentive ? Math.round(frameTimeMs / 1000) : 0;

    console.log("updateAttendance called:", { studentId, name, isAttentive, frameTimeMs, totalTimeSec, alertTimeSec });

    if (!studentData) {
      // First time seeing this student in the session
      console.log("Creating NEW attendance record:", {
        student_id: studentId,
        session_id: sessionIdRef.current,
        status: "present",
        confidence: isAttentive ? 100 : 0,
        start_time: now.toISOString(),
        end_time: now.toISOString(),
        total_time: totalTimeSec,
        alert_time: alertTimeSec,
        alertness: isAttentive ? 100 : 0
      });
      
      const { data, error } = await db.from("attendance").insert({
        student_id: studentId,
        session_id: sessionIdRef.current,
        status: "present",
        confidence: isAttentive ? 100 : 0,
        start_time: now.toISOString(),
        end_time: now.toISOString(),
        total_time: totalTimeSec,
        alert_time: alertTimeSec,
        alertness: isAttentive ? 100 : 0
      }).select().single();

      if (error) {
        console.error("Error creating attendance:", error);
        return null;
      }

      studentData = {
        studentId,
        name,
        startTime: now,
        lastSeenTime: now,
        totalTime: frameTimeMs,
        alertTime: isAttentive ? frameTimeMs : 0,
        attendanceId: data?.id || null
      };
      studentDataRef.current.set(studentId, studentData);
      setLastMarkedName(name);
      setMessage({ type: 'success', text: `✅ ${name} joined the session` });
      
      console.log("Created attendance record with ID:", data?.id);
      
      return data?.id || null;
    }

    // Update existing attendance record - accumulate times
    const newTotalTime = studentData.totalTime + frameTimeMs;
    const newAlertTime = studentData.alertTime + (isAttentive ? frameTimeMs : 0);
    const newAlertness = newTotalTime > 0 ? Math.round((newAlertTime / newTotalTime) * 100) : 0;
    
    // Calculate seconds for database
    const newTotalTimeSec = Math.round(newTotalTime / 1000);
    const newAlertTimeSec = Math.round(newAlertTime / 1000);

    studentData.lastSeenTime = now;
    studentData.totalTime = newTotalTime;
    studentData.alertTime = newAlertTime;

    console.log("Updating attendance in-memory:", { 
      newTotalTimeMs: newTotalTime,
      newAlertTimeMs: newAlertTime,
      newTotalTimeSec, 
      newAlertTimeSec,
      newAlertness,
      attendanceId: studentData.attendanceId
    });

    if (studentData.attendanceId) {
      console.log("Attempting database update for ID:", studentData.attendanceId);
      console.log("Update payload:", {
        end_time: now.toISOString(),
        total_time: newTotalTimeSec,
        alert_time: newAlertTimeSec,
        alertness: newAlertness,
        confidence: newAlertness,
        status: newAlertness >= 60 ? 'present' : 'absent'
      });
      
      const { data, error } = await db
        .from("attendance")
        .update({
          end_time: now.toISOString(),
          total_time: newTotalTimeSec,
          alert_time: newAlertTimeSec,
          alertness: newAlertness,
          confidence: newAlertness,
          status: newAlertness >= 60 ? 'present' : 'absent'
        })
        .eq("id", studentData.attendanceId);
        
      if (error) {
        console.error("❌ Error updating attendance:", error);
      } else {
        console.log("✅ Attendance updated successfully:", data);
      }
    }

    return studentData.attendanceId;
  };


  const processFrame = async () => {
    if (!runningRef.current || !videoRef.current || !canvasRef.current) return;

    const now = Date.now();
    
    // Calculate actual time since last frame
    let frameTimeMs = now - lastFrameTimeRef.current;
    
    // Ensure we don't have unrealistic values (too small or too large)
    // Minimum 500ms (half the interval), Maximum 5000ms (2.5x the interval)
    if (frameTimeMs < 500) frameTimeMs = 500;
    if (frameTimeMs > 5000) frameTimeMs = 5000;
    
    // Update last frame time for next calculation
    lastFrameTimeRef.current = now;

    const detections = await detectFaces(videoRef.current);
    
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let attentiveCount = 0;
    let presentCount = 0;

    for (const det of detections) {
      const attention = calculateAttention(det.landmarks);
      const attentive = attention.attentionScore >= 60;
      
      if (attentive) attentiveCount++;

      const match = findMatch(det.descriptor);
      
      if (match && sessionIdRef.current) {
        // Update attendance tracking with milliseconds
        await updateAttendance(match.id, match.name, attentive, frameTimeMs);
        presentCount++;
      }

      const box = det.detection.box;
      
      // Color coding based on attentiveness
      if (match) {
        if (attentive) {
          ctx.strokeStyle = "#22c55e"; // Green - Attentive
          ctx.fillText(
            `${match.name} ✅ ${Math.round(attention.attentionScore)}%`,
            box.x + 6,
            box.y - 6
          );
        } else {
          ctx.strokeStyle = "#eab308"; // Yellow - Not attentive
          ctx.fillText(
            `${match.name} ⚠️ ${Math.round(attention.attentionScore)}%`,
            box.x + 6,
            box.y - 6
          );
        }
      } else {
        ctx.strokeStyle = "#ef4444"; // Red - Unknown
        ctx.fillText(
          `Unknown ${Math.round(attention.attentionScore)}%`,
          box.x + 6,
          box.y - 6
        );
      }
      
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(box.x, box.y - 22, box.width, 22);
    }

    setStats({ detected: detections.length, attentive: attentiveCount, present: presentCount });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Video /> Live Attendance
        </h2>

        <div className="flex gap-2">
          {!currentSession ? (
            <button
              onClick={startSession}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Start Session
            </button>
          ) : (
            <button
              onClick={endSession}
              className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> End Session
            </button>
          )}
          
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 text-white rounded ${
              isMonitoring ? "bg-red-600" : "bg-blue-600"
            }`}
            disabled={!currentSession}
          >
            {isMonitoring ? <VideoOff /> : <Video />}
          </button>
        </div>
      </div>

      {/* Session Info */}
      {currentSession && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          📹 Session Active: {currentSession.name}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-100 p-3 rounded flex items-center gap-2">
          <Users /> Faces: {stats.detected}
        </div>
        <div className="bg-green-100 p-3 rounded flex items-center gap-2">
          <Eye /> Attentive: {stats.attentive}
        </div>
        <div className="bg-purple-100 p-3 rounded flex items-center gap-2">
          <CheckCircle /> Present: {stats.present}
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
           message.type === 'error' ? <XCircle className="w-5 h-5" /> : null}
          {message.text}
        </div>
      )}

      {students.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
          No students registered. Please register students first before marking attendance.
        </div>
      )}

      <div className="relative bg-black rounded overflow-hidden">
        <video
          ref={videoRef}
          className="w-full"
          autoPlay
          muted
          playsInline
          style={{ display: isMonitoring ? "block" : "none" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          style={{ display: isMonitoring ? "block" : "none" }}
        />
      </div>
    </div>
  );
}

