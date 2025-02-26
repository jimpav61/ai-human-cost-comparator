
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { LeadsTable } from '@/components/admin/LeadsTable';

interface Lead {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string | null;
  website: string | null;
  calculator_inputs: any;
  calculator_results: any;
  created_at: string;
  proposal_sent: boolean;
}

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLeads = async () => {
    try {
      console.log("Starting fetchLeads...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session in fetchLeads:", session);
      
      if (!session) {
        console.log("No session found in fetchLeads");
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      console.log("Leads query response:", { data, error });

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Initial session check:", session);
      
      if (!session) {
        console.log("No initial session found, redirecting to auth");
        toast({
          title: "Access Denied",
          description: "Please sign in to access the admin dashboard",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      fetchLeads();
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
        return;
      }
      
      if (event === 'SIGNED_IN') {
        await fetchLeads();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <AdminHeader />
      <LeadsTable leads={leads} onLeadUpdate={fetchLeads} />
    </div>
  );
};

export default AdminDashboard;
