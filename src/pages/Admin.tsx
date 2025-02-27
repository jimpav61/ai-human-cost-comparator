
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
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
          <LeadsTable leads={leads} />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
