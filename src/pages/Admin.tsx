
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LeadsTable } from "@/components/admin/LeadsTable";
import { PricingManager } from "@/components/admin/PricingManager";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CsvUploader } from "@/components/admin/CsvUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

const Admin = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Function to check auth and load data
  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    
    // Set a timeout to handle hanging requests
    const timeoutId = setTimeout(() => {
      setError("Authentication request timed out. Please try again.");
      setLoading(false);
    }, 10000); // Extended timeout to 10 seconds
    
    try {
      // Check if user is logged in
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      clearTimeout(timeoutId);
      
      if (sessionError) {
        throw new Error(sessionError.message);
      }
      
      if (!sessionData.session) {
        console.log("No session found, redirecting to auth");
        navigate('/auth');
        return;
      }
      
      // Check if user is admin using has_role function
      try {
        const { data: isAdmin, error: adminError } = await supabase
          .rpc('has_role', { role_to_check: 'admin' });
        
        // If there's an error with the role check or user is not admin
        if (adminError || !isAdmin) {
          console.log("User is not admin, access denied", { adminError, isAdmin });
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive"
          });
          
          // Sign out the user
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
        
        console.log("User confirmed as admin, proceeding to load data");
      } catch (roleError) {
        console.error("Error checking admin role:", roleError);
        toast({
          title: "Error",
          description: "Failed to verify admin privileges",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      // If we got here, user is authenticated and has admin privileges
      // Load leads data
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (leadsError) {
        throw new Error(leadsError.message);
      }
      
      setLeads(leadsData || []);
      
    } catch (err: any) {
      console.error("Admin page error:", err);
      setError(err.message || "An error occurred");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };
  
  // Load data on initial render
  useEffect(() => {
    loadAdminData();
    
    // Setup auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-amber-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={loadAdminData} className="w-full">
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

  // Render admin dashboard
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
