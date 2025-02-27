
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Admin: Checking session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Admin: Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log("Admin: No session found, redirecting to login...");
          window.location.href = '/';
          return;
        }

        console.log("Admin: Session found, checking admin status...", session);

        const { data: adminCheck, error: adminError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (adminError) {
          console.error("Admin: Admin check error:", adminError);
          throw adminError;
        }

        if (!adminCheck) {
          console.log("Admin: Not an admin, redirecting...");
          await supabase.auth.signOut();
          window.location.href = '/';
          return;
        }

        console.log("Admin: Admin verified successfully");
        setLoading(false);

      } catch (error) {
        console.error('Admin: Auth check error:', error);
        toast({
          title: "Error",
          description: "An error occurred while checking authentication",
          variant: "destructive",
        });
        window.location.href = '/';
      }
    };

    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Admin: Auth state changed:", event, session);
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
      <div className="text-center">
        <p>You are logged in as an admin.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
