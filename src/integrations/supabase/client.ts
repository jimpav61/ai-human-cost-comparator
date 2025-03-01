
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeWhtY2htanpsbXNpbXRydG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTY5MjgsImV4cCI6MjA1NjE3MjkyOH0.SC-lanLW6TQ6c3BWGPvxtjPpB5oufTvb8j-FmLFHGwI";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY
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
