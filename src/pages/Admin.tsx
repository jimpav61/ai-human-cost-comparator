
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { PricingManager } from '@/components/admin/PricingManager';
import { Lead } from '@/types/leads';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If no session, redirect to auth page
        if (!session) {
          window.location.href = '/auth';
          return;
        }

        // Get leads data
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        // Handle the case where leadsData is null or empty
        if (!leadsData || leadsData.length === 0) {
          console.log("No leads found");
          setLeads([]);
          setLoading(false);
          return;
        }

        // Transform the data to match the Lead type with proper type checking
        const transformedLeads: Lead[] = leadsData.map(lead => ({
          id: lead.id || "",
          name: lead.name || "",
          company_name: lead.company_name || "",
          email: lead.email || "",
          phone_number: lead.phone_number || "",
          website: lead.website || null,
          industry: lead.industry || "Not Specified",
          employee_count: lead.employee_count || 0,
          calculator_inputs: lead.calculator_inputs || {},
          calculator_results: lead.calculator_results || {},
          proposal_sent: lead.proposal_sent || false,
          created_at: lead.created_at,
          form_completed: lead.form_completed || false
        }));

        setLeads(transformedLeads);
        setLoading(false);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the dashboard",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    checkAuth();

    // Add auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/auth';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="destructive" onClick={() => supabase.auth.signOut()}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          {leads.length === 0 ? (
            <div className="p-8 bg-white rounded-lg shadow text-center">
              <h2 className="text-xl font-semibold mb-4">No Leads Yet</h2>
              <p className="text-gray-600">
                There are no leads in the system yet. Leads will appear here when users submit the lead form on the homepage.
              </p>
            </div>
          ) : (
            <LeadsTable leads={leads} />
          )}
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
