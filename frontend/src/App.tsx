import { useState } from 'react';
import { GraduationCap, UserPlus, Video, BarChart3, AlertTriangle } from 'lucide-react';
import { StudentRegistration } from './components/StudentRegistration';
import { LiveAttendance } from './components/LiveAttendance';
import { AttendanceDashboard } from './components/AttendanceDashboard';
import { supabase } from './lib/supabase';

type Tab = 'register' | 'monitor' | 'dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const isSupabaseConfigured = !!supabase;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {!isSupabaseConfigured && (
        <div className="bg-yellow-100 border-b border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Supabase is not configured. Please add your credentials to the .env file to enable database features.</span>
          </div>
        </div>
      )}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Smart Attendance System
                </h1>
                <p className="text-sm text-gray-600">
                  Face Recognition & Attention-Based Attendance
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Register Students
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'monitor'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Video className="w-5 h-5" />
              Live Monitoring
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Attendance Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">How It Works</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Register students by capturing their face using the camera</li>
            <li>2. Start live monitoring to detect faces and track attention levels</li>
            <li>3. Attendance is marked only when students maintain 75% attention threshold</li>
            <li>4. View attendance records and export to CSV for analysis</li>
          </ul>
        </div>

        {activeTab === 'register' && <StudentRegistration />}
        {activeTab === 'monitor' && <LiveAttendance />}
        {activeTab === 'dashboard' && <AttendanceDashboard />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Face Recognition & Attention-Based Attendance System - Real-time Processing with OpenCV & KNN
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
