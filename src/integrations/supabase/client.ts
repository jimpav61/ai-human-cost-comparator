
// This file initializes the Supabase client with minimal configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeWhtY2htanpsbXNpbXRydG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTY5MjgsImV4cCI6MjA1NjE3MjkyOH0.SC-lanLW6TQ6c3BWGPvxtjPpB5oufTvb8j-FmLFHGwI";

// Log environment info
console.log("Initializing Supabase client:", { 
  url: SUPABASE_URL, 
  environment: process.env.NODE_ENV,
  origin: window.location.origin
});

// Create the client with minimal configuration to reduce potential issues
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Disable URL detection to avoid redirect issues
    }
  }
);

// Simple log for initial session check
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error("Initial session check error:", error);
  } else {
    console.log("Initial session check:", data.session ? "Session found" : "No session");
  }
});
