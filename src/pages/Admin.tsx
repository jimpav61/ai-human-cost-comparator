
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
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!session) return;

      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
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

    fetchLeads();
  }, [session]);

  if (!session) {
    return null;
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const handleLeadUpdate = () => {
    setLoading(true);
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
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
    fetchLeads();
  };

  return (
    <div className="container mx-auto py-10">
      <AdminHeader />
      <LeadsTable leads={leads} onLeadUpdate={handleLeadUpdate} />
    </div>
  );
};

export default AdminDashboard;
