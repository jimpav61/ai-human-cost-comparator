
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

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Only check admin status and fetch leads if we have a session
      const { data: adminCheck } = await supabase
        .from('allowed_admins')
        .select('email')
        .eq('email', session.user.email)
        .single();

      if (!adminCheck) {
        navigate('/auth');
        return;
      }

      // If we're an admin, fetch the leads
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      setLeads(data || []);
      setLoading(false);
    };

    checkSession();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    }
  };

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
