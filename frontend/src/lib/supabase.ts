import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wdawnbxrafqggmcwhamz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXduYnhyYWZxZ2dtY3doYW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NzY0NDcsImV4cCI6MjA4NTM1MjQ0N30.cbxuWeZvdkGDK-9k2D0KPcM2ljnEVqmvGHUQMCP6TOW';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXduYnhyYWZxZ2dtY3doYW16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc3NjQ0NywiZXhwIjoyMDg1MzUyNDQ3fQ.bVD2z4TI6boL_IGJaCfet7Ydz9ewK9rmcKhxNf7EMgg';

// Debug: Log what values we're getting
console.log('=== Supabase Config Debug ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined');
console.log('VITE_SUPABASE_SERVICE_KEY:', import.meta.env.VITE_SUPABASE_SERVICE_KEY ? import.meta.env.VITE_SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'undefined');
console.log('URL being used:', supabaseUrl);
console.log('Anon key being used:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'none');
console.log('Service key being used:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'none');

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Create client with anon key for public operations
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (err) {
    console.error('❌ Error creating Supabase client:', err);
  }
} else {
  console.warn('⚠️ Supabase client not initialized - missing URL or key');
}

// Create admin client with service role key for full access
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase admin client initialized successfully');
  } catch (err) {
    console.error('❌ Error creating Supabase admin client:', err);
  }
}

export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;

export interface Student {
  id: string;
  name: string;
  email: string | null;
  face_encoding: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  start_time: string;
  end_time: string | null;
  total_time: string | null;
  alert_time: string | null;
  alertness_percentage: number;
  attendance_status: string;
  created_at: string;
}
