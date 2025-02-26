
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      try {
        const { data: adminCheck, error } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (error || !adminCheck) {
          throw new Error('Unauthorized');
        }

        setLoading(false);
      } catch (error) {
        console.error('Access check error:', error);
        toast({
          title: "Unauthorized",
          description: "You don't have access to this page",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
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
      
      {/* Admin content will go here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Welcome to the admin dashboard. We'll build out more features here.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
