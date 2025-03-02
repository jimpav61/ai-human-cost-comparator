
import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { PricingManager } from "@/components/admin/PricingManager";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CsvUploader } from "@/components/admin/CsvUploader";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Admin = () => {
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

  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Taking Too Long</h1>
          <p className="text-gray-600 mb-6">
            We're having trouble verifying your admin credentials. This could be due to network issues or server response delays.
          </p>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" onClick={handleGoBack}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          {retryCount > 0 && (
            <p className="text-gray-500 mt-2">Attempt {retryCount + 1}...</p>
          )}
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            {authError}
          </p>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button variant="outline" onClick={handleGoBack}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader isLoading={isLoading} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads Management</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Configuration</TabsTrigger>
            <TabsTrigger value="import">Import Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-8">
            <LeadsTable leads={leads} />
          </TabsContent>
          
          <TabsContent value="pricing">
            <PricingManager />
          </TabsContent>
          
          <TabsContent value="import">
            <CsvUploader />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
