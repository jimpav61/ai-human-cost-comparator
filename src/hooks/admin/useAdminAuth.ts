
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";

export function useAdminAuth() {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingTimeout, setLoadingTimeout] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    let timeoutId: number;
    
    try {
      // Set a timeout to detect if auth check is taking too long
      timeoutId = window.setTimeout(() => {
        console.log("Auth check taking too long");
        setLoadingTimeout(true);
      }, 5000);
      
      console.log("Admin page: Checking authentication");
      const { data, error } = await supabase.auth.getSession();
      
      // Clear the timeout since we got a response
      window.clearTimeout(timeoutId);
      
      if (error) {
        console.error("Session error:", error);
        setAuthError(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log("Admin page: Session data:", data.session);
      setSession(data.session);
      
      if (!data.session) {
        console.log("No active session, redirecting to login");
        setIsLoading(false);
        return;
      }
      
      // Check if user has admin role
      const { data: userData, error: userError } = await supabase
        .rpc('has_role', { role_to_check: 'admin' });
        
      if (userError) {
        console.error("Role check error:", userError);
        setAuthError(userError.message);
        setIsLoading(false);
        return;
      }
      
      console.log("Admin role check:", userData);
      setIsAdmin(userData === true);
      
      if (userData) {
        // Fetch leads data
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (leadsError) {
          console.error("Leads fetch error:", leadsError);
          setAuthError(leadsError.message);
        } else {
          setLeads(leadsData as Lead[] || []);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || "Authentication failed");
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Make sure to clear the timeout and set loading to false
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Initial auth check
    checkAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Admin page: Auth state changed:", event);
        setSession(session);
        
        if (!session) {
          console.log("Session ended, redirecting to login");
          setIsAdmin(false);
          setLeads([]);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        
        try {
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) {
            console.error('Role check error:', userError);
            setAuthError(userError.message);
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }
          
          setIsAdmin(userData === true);
          
          if (userData) {
            const { data: leadsData, error: leadsError } = await supabase
              .from('leads')
              .select('*')
              .order('created_at', { ascending: false });
              
            if (leadsError) {
              console.error('Leads fetch error:', leadsError);
              setAuthError(leadsError.message);
            } else {
              setLeads(leadsData as Lead[] || []);
            }
          }
        } catch (error: any) {
          console.error("Error during auth state change:", error);
          setAuthError(error.message || "Authentication error");
        } finally {
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      // Clean up the auth listener
      authListener.subscription.unsubscribe();
    };
  }, [checkAuth]);

  const handleRetry = () => {
    setIsLoading(true);
    setAuthError(null);
    setLoadingTimeout(false);
    setRetryCount(retryCount + 1);
    checkAuth();
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return {
    session,
    isAdmin,
    isLoading,
    authError,
    leads,
    loadingTimeout,
    retryCount,
    handleRetry,
    handleGoBack
  };
}
