
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
    const fetchLeads = async () => {
      try {
        console.log('Fetching leads...');
        
        // Get leads data without any authentication check
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsError) {
          console.error('Leads fetch error:', leadsError);
          throw leadsError;
        }

        console.log('Leads data received:', leadsData);

        if (leadsData && leadsData.length > 0) {
          const transformedLeads = leadsData.map(lead => ({
            id: lead.id,
            name: lead.name,
            company_name: lead.company_name,
            email: lead.email,
            phone_number: lead.phone_number || '',
            website: lead.website || null,
            industry: lead.industry || 'Not Specified',
            employee_count: lead.employee_count || 0,
            calculator_inputs: lead.calculator_inputs || {},
            calculator_results: lead.calculator_results || {},
            proposal_sent: lead.proposal_sent || false,
            created_at: lead.created_at,
            form_completed: lead.form_completed || false
          }));
          
          console.log('Transformed leads:', transformedLeads);
          setLeads(transformedLeads);
        } else {
          console.log('No leads data found');
          setLeads([]);
        }
        
        setLoading(false);

      } catch (error: any) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to load leads: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchLeads();
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
        <Button variant="destructive" onClick={() => window.location.href = '/'}>
          Back to Home
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
