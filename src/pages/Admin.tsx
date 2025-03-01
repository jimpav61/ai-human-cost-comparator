
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
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Admin page: Checking authentication");
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          throw error;
        }
        
        console.log("Admin page: Session data:", data.session);
        setSession(data.session);
        
        if (!data.session) {
          console.log("No active session, redirecting to login");
          navigate("/auth");
          return;
        }
        
        // Check if the user has admin role
        const { data: userData, error: userError } = await supabase
          .rpc('has_role', { role_to_check: 'admin' });
          
        if (userError) {
          console.error("Role check error:", userError);
          throw userError;
        }
        
        console.log("Admin role check:", userData);
        setIsAdmin(userData || false);
        
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
          setLeads(leadsData || []);
        } else {
          console.log("User is not an admin, redirecting");
          navigate("/auth");
        }
      } catch (error: any) {
        console.error('Auth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };
    
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
          navigate("/auth");
          setIsLoading(false);
          return;
        }
        
        try {
          // Check if the user has admin role
          const { data: userData, error: userError } = await supabase
            .rpc('has_role', { role_to_check: 'admin' });
            
          if (userError) {
            console.error('Role check error:', userError);
            setIsAdmin(false);
            navigate("/auth");
            return;
          }
          
          setIsAdmin(userData || false);
          
          if (userData) {
            // Fetch leads for admin
            const { data: leadsData, error: leadsError } = await supabase
              .from('leads')
              .select('*')
              .order('created_at', { ascending: false });
              
            if (leadsError) {
              console.error('Leads fetch error:', leadsError);
            } else {
              setLeads(leadsData || []);
            }
          } else {
            navigate("/auth");
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
          navigate("/auth");
        } finally {
          setIsLoading(false);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
      <AdminHeader />
      
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
