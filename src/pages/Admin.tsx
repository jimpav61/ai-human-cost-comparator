
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { LeadsTable } from '@/components/admin/LeadsTable';
import { Lead } from '@/types/leads';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          window.location.href = '/';
          return;
        }

        const { data: adminCheck, error: adminError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (adminError || !adminCheck) {
          await supabase.auth.signOut();
          window.location.href = '/';
          return;
        }

        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        setLeads(leadsData || []);
        setLoading(false);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the dashboard",
          variant: "destructive",
        });
        window.location.href = '/';
      }
    };

    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/';
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <LeadsTable leads={leads} />
    </div>
  );
};

export default AdminDashboard;
