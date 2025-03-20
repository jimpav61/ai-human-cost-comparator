
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeWhtY2htanpsbXNpbXRydG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTY5MjgsImV4cCI6MjA1NjE3MjkyOH0.SC-lanLW6TQ6c3BWGPvxtjPpB5oufTvb8j-FmLFHGwI";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  }
);

// Simple function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log("Auth check data:", data);
    return { 
      authenticated: !!data?.session, 
      session: data?.session, 
      error 
    };
  } catch (e) {
    console.error("Auth check failed:", e);
    return { authenticated: false, session: null, error: e };
  }
};

// Safe sign out function that handles missing sessions
export const safeSignOut = async () => {
  try {
    // Directly call signOut without checking for session first
    // This addresses the issue where session checks were returning errors
    const { error } = await supabase.auth.signOut();
    
    if (error && error.message !== "Session not found") {
      // Only treat as a real error if it's not the "Session not found" error
      return { success: false, error };
    }
    
    // Consider both cases a success - either signed out or no session to sign out from
    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
};
