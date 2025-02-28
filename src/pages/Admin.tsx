
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

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Function to check authentication and admin status
    const checkAuth = async () => {
      console.log("Starting auth check in Admin component");
      try {
        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
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
          setIsAdmin(false);
        }
      } catch (e) {
        console.error("Auth check exception:", e);
      } finally {
        setIsLoading(false);
        setAuthCheckComplete(true);
      }
    };
    
    // Run the auth check
    checkAuth();
    
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
        
        // Check admin role on auth state change
        try {
          const { data: adminData, error: adminError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
          
          if (adminError) {
            console.error("Role check error:", adminError);
            setIsAdmin(false);
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
        }
      }
    );
    
    // Clean up
    return () => {
      console.log("Cleaning up auth listener in Admin");
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Debug output
  console.log("Admin component state:", { 
    isLoading, 
    authCheckComplete, 
    hasSession: !!session, 
    isAdmin, 
    leadsCount: leads.length 
  });

  // Show loading state
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
