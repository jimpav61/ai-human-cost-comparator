
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

  // Sample leads data to ensure admin always has leads to display
  const sampleLeads: Lead[] = [
    {
      id: "sample-1",
      name: "John Smith",
      company_name: "Tech Innovations",
      email: "john@techinnovations.com",
      phone_number: "555-123-4567",
      website: "https://techinnovations.com",
      industry: "Information Technology",
      employee_count: 45,
      calculator_inputs: {
        supportTeamSize: 10,
        averageSalary: 65000,
        callsPerDay: 120,
        chatMessagesPerDay: 350
      },
      calculator_results: {
        aiCostMonthly: { voice: 85, chatbot: 199, total: 284 },
        humanCostMonthly: 5400,
        monthlySavings: 5116,
        yearlySavings: 61392,
        savingsPercentage: 94.7,
        breakEvenPoint: { voice: 240, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 400,
          monthlyTotal: 1600,
          yearlyTotal: 19200
        }
      },
      proposal_sent: false,
      created_at: "2023-10-15T14:30:00Z",
      form_completed: true
    },
    {
      id: "sample-2",
      name: "Sarah Johnson",
      company_name: "Retail Solutions",
      email: "sarah@retailsolutions.com",
      phone_number: "555-987-6543",
      website: "https://retailsolutions.com",
      industry: "Retail",
      employee_count: 120,
      calculator_inputs: {
        supportTeamSize: 25,
        averageSalary: 55000,
        callsPerDay: 350,
        chatMessagesPerDay: 800
      },
      calculator_results: {
        aiCostMonthly: { voice: 210, chatbot: 350, total: 560 },
        humanCostMonthly: 11450,
        monthlySavings: 10890,
        yearlySavings: 130680,
        savingsPercentage: 95.1,
        breakEvenPoint: { voice: 310, chatbot: 650 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 1000,
          monthlyTotal: 4000,
          yearlyTotal: 48000
        }
      },
      proposal_sent: true,
      created_at: "2023-11-02T09:15:00Z",
      form_completed: true
    },
    {
      id: "sample-3",
      name: "Michael Brown",
      company_name: "Healthcare Solutions",
      email: "michael@healthcaresolutions.com",
      phone_number: "555-456-7890",
      website: "https://healthcaresolutions.com",
      industry: "Healthcare",
      employee_count: 75,
      calculator_inputs: {
        supportTeamSize: 15,
        averageSalary: 70000,
        callsPerDay: 180,
        chatMessagesPerDay: 450
      },
      calculator_results: {
        aiCostMonthly: { voice: 150, chatbot: 220, total: 370 },
        humanCostMonthly: 8750,
        monthlySavings: 8380,
        yearlySavings: 100560,
        savingsPercentage: 95.8,
        breakEvenPoint: { voice: 280, chatbot: 580 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 600,
          monthlyTotal: 2400,
          yearlyTotal: 28800
        }
      },
      proposal_sent: false,
      created_at: "2023-12-10T11:45:00Z",
      form_completed: true
    }
  ];

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

        // Start with sample leads
        let combinedLeads = [...sampleLeads];

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
          
          // Add database leads first, then sample leads
          combinedLeads = [...transformedLeads, ...sampleLeads];
        }
        
        setLeads(combinedLeads);
        setLoading(false);

      } catch (error: any) {
        console.error('Error fetching leads:', error);
        toast({
          title: "Error",
          description: "Failed to load leads from database. Showing sample leads only.",
          variant: "destructive",
        });
        
        // Set sample leads even if there's an error
        setLeads(sampleLeads);
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
