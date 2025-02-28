
import { useState, useEffect } from "react";
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
import { RefreshCw } from "lucide-react";

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkTimeout, setCheckTimeout] = useState(false);
  const navigate = useNavigate();

  // Function to handle auth check with timeout
  const checkAuthWithTimeout = async () => {
    console.log("Starting auth check in Admin component");
    // Reset state for retry attempts
    setAuthError(null);
    setCheckTimeout(false);
    setIsLoading(true);
    
    // Set a timeout to detect hanging requests
    const timeoutId = setTimeout(() => {
      console.log("Auth check timed out after 10 seconds");
      setCheckTimeout(true);
      setIsLoading(false);
    }, 10000);
    
    try {
      // Get the current session
      const { data, error } = await supabase.auth.getSession();
      
      // Clear timeout as we got a response
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Session error:", error);
        setAuthError(error.message);
        setSession(null);
        setIsAdmin(false);
        setIsLoading(false);
        setAuthCheckComplete(true);
        return;
      }
      
      if (!data.session) {
        console.log("No active session found");
        setSession(null);
        setIsLoading(false);
        setAuthCheckComplete(true);
        return;
      }
      
      console.log("Session found:", data.session.user.email);
      setSession(data.session);
      
      // Check admin role
      try {
        const { data: adminData, error: adminError } = await supabase
          .rpc('has_role', { role_to_check: 'admin' });
        
        if (adminError) {
          console.error("Admin role check error:", adminError);
          setAuthError(adminError.message);
          setIsAdmin(false);
          setIsLoading(false);
          setAuthCheckComplete(true);
          return;
        }
        
        console.log("Admin check result:", adminData);
        setIsAdmin(adminData || false);
        
        // Only fetch leads if user is admin
        if (adminData) {
          try {
            const { data: leadsData, error: leadsError } = await supabase
              .from('leads')
              .select('*')
              .order('created_at', { ascending: false });
            
            if (leadsError) {
              console.error("Error fetching leads:", leadsError);
            } else {
              console.log(`Fetched ${leadsData?.length || 0} leads`);
              setLeads(leadsData || []);
            }
          } catch (e) {
            console.error("Leads fetch exception:", e);
          }
        }
      } catch (e) {
        console.error("Admin check exception:", e);
        setAuthError(e instanceof Error ? e.message : "Unknown error checking admin status");
        setIsAdmin(false);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error("Auth check exception:", e);
      setAuthError(e instanceof Error ? e.message : "Unknown authentication error");
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setAuthCheckComplete(true);
    }
  };

  useEffect(() => {
    // Initial auth check
    checkAuthWithTimeout();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed in Admin:", event);
        setSession(session);
        
        if (!session) {
          setIsAdmin(false);
          setLeads([]);
          return;
        }
        
        // Re-check admin role on auth state change
        setIsLoading(true);
        
        try {
          const { data: adminData, error: adminError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
          
          if (adminError) {
            console.error("Role check error:", adminError);
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }
          
          setIsAdmin(adminData || false);
          
          // Fetch leads if admin
          if (adminData) {
            try {
              const { data: leadsData, error: leadsError } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });
              
              if (leadsError) {
                console.error("Leads fetch error:", leadsError);
              } else {
                setLeads(leadsData || []);
              }
            } catch (e) {
              console.error("Leads fetch exception:", e);
            }
          }
        } catch (e) {
          console.error("Admin check exception on auth change:", e);
          setIsAdmin(false);
        } finally {
          setIsLoading(false);
        }
      }
    );
    
    // Clean up
    return () => {
      console.log("Cleaning up auth listener in Admin");
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Allow manual retry if we detect a timeout
  const handleRetry = () => {
    checkAuthWithTimeout();
  };

  // Debug output
  console.log("Admin component state:", { 
    isLoading, 
    authCheckComplete, 
    hasSession: !!session, 
    isAdmin, 
    leadsCount: leads.length,
    checkTimeout,
    authError
  });

  // Handle timeout case
  if (checkTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-amber-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Timeout</h2>
          <p className="text-gray-600 mb-4">The authentication request is taking longer than expected. This may be due to network issues or Supabase service limitations.</p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Authentication
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
              Go to Login Page
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show regular loading state
  if (isLoading || !authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">
            {isLoading ? "Checking permissions..." : "Preparing dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // Display auth errors
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Authentication
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
              Go to Login Page
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to auth if no session
  if (!session) {
    console.log("No session, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // Redirect to auth if not admin
  if (!isAdmin) {
    console.log("Not admin, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }

  // Render admin dashboard
  console.log("Rendering admin dashboard");
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads Management</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Configuration</TabsTrigger>
            <TabsTrigger value="import">Import Leads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-8">
            {leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No leads found. Try importing some using the Import tab.</p>
              </div>
            ) : (
              <LeadsTable leads={leads} />
            )}
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
