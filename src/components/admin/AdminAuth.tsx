
import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";

interface AdminAuthProps {
  children: React.ReactNode;
  setSession: (session: any) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLeads: (leads: Lead[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  setLoadingTimeout: (timeout: boolean) => void;
  setRetryCount: (count: number) => void;
  retryCount: number;
}

export const AdminAuth = ({
  children,
  setSession,
  setIsAdmin,
  setLeads,
  setIsLoading,
  setAuthError,
  setLoadingTimeout,
  setRetryCount,
  retryCount
}: AdminAuthProps) => {
  const checkAuth = useCallback(async () => {
    let timeoutId: number;
    
    try {
      // Set a timeout to notify the user if authentication check takes too long
      timeoutId = window.setTimeout(() => {
        console.log("Auth check taking too long");
        setLoadingTimeout(true);
      }, 5000);
      
      console.log("Admin page: Checking authentication");
      const { data, error } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Session error:", error);
        setAuthError(error.message);
        throw error;
      }
      
      console.log("Admin page: Session data:", data.session);
      setSession(data.session);
      
      if (!data.session) {
        console.log("No active session, redirecting to login");
        window.location.href = "/auth";
        return;
      }
      
      // Check if the user has admin role
      const { data: userData, error: userError } = await supabase
        .rpc('has_role', { role_to_check: 'admin' });
        
      if (userError) {
        console.error("Role check error:", userError);
        setAuthError(userError.message);
        throw userError;
      }
      
      console.log("Admin role check:", userData);
      setIsAdmin(userData === true);
      
      if (userData) {
        // Fetch leads for admin
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (leadsError) {
          console.error("Leads fetch error:", leadsError);
          throw leadsError;
        }
        
        console.log("Fetched leads:", leadsData?.length || 0);
        setLeads(leadsData as Lead[] || []);
      } else {
        console.log("User is not an admin, redirecting");
        window.location.href = "/auth";
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
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [setSession, setIsAdmin, setLeads, setIsLoading, setAuthError, setLoadingTimeout]);

  const handleRetry = () => {
    setIsLoading(true);
    setAuthError(null);
    setLoadingTimeout(false);
    setRetryCount(retryCount + 1);
    checkAuth();
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  useEffect(() => {
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Admin page: Auth state changed:", event);
        setSession(session);
        setIsLoading(true);
        
        if (!session) {
          console.log("Session ended, redirecting to login");
          setIsAdmin(false);
          setLeads([]);
          window.location.href = "/auth";
          setIsLoading(false);
          return;
        }
        
        try {
          // Check if the user has admin role
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) {
            console.error('Role check error:', userError);
            setAuthError(userError.message);
            setIsAdmin(false);
            window.location.href = "/auth";
            return;
          }
          
          setIsAdmin(userData === true);
          
          if (userData) {
            // Fetch leads for admin
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
          } else {
            window.location.href = "/auth";
          }
        } catch (error: any) {
          console.error("Error during auth state change:", error);
          setAuthError(error.message || "Authentication error");
          window.location.href = "/auth";
        } finally {
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkAuth, setSession, setIsAdmin, setLeads, setIsLoading, setAuthError]);

  return children;
};
