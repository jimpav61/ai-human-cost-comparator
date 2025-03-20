
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ujyhmchmjzlmsimtrtor.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeWhtY2htanpsbXNpbXRydG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTY5MjgsImV4cCI6MjA1NjE3MjkyOH0.SC-lanLW6TQ6c3BWGPvxtjPpB5oufTvb8j-FmLFHGwI";

// Create a more robust storage object with fallbacks
const createCustomStorage = () => {
  // Basic storage interface
  const memoryStorage: Record<string, string> = {};
  
  // Create a fallback storage that uses memory if localStorage is not available
  return {
    getItem: (key: string): string | null => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return memoryStorage[key] || null;
      } catch (error) {
        console.error('Error accessing storage:', error);
        return memoryStorage[key] || null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        memoryStorage[key] = value;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('Error writing to storage:', error);
      }
    },
    removeItem: (key: string): void => {
      try {
        delete memoryStorage[key];
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Error removing from storage:', error);
      }
    }
  };
};

// Create a single instance of the custom storage
const customStorage = createCustomStorage();

// Initialize the Supabase client with robust configuration
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: customStorage
    }
  }
);

// Enhanced authentication check function with better error handling
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

// Improved sign out function with better error handling
export const safeSignOut = async () => {
  try {
    // Direct sign out without checking session first
    const { error } = await supabase.auth.signOut();
    
    if (error && error.message !== "Session not found") {
      // Only treat as a real error if it's not the "Session not found" error
      console.error("Sign out error:", error);
      return { success: false, error };
    }
    
    // Consider both cases a success - either signed out or no session to sign out from
    return { success: true, error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error };
  }
};
