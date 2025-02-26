
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIVsHumanCalculator } from '@/components/AIVsHumanCalculator';
import { LeadForm } from '@/components/LeadForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const queryClient = new QueryClient();

export default function IndexPage() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkUserRole(session?.user?.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkUserRole(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLeadSubmit = (data: any) => {
    setHasSubmittedLead(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-4">
            {session ? (
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="ml-2"
              >
                Sign Out
              </Button>
            ) : (
              <Button 
                onClick={handleSignIn}
                className="ml-2"
              >
                Sign In with Google
              </Button>
            )}
          </div>

          {!showAdmin && isAdmin && (
            <div className="text-right mb-4">
              <button
                onClick={() => setShowAdmin(true)}
                className="text-sm text-gray-600 hover:text-brand-500"
              >
                Admin Dashboard →
              </button>
            </div>
          )}

          {session ? (
            showAdmin && isAdmin ? (
              <div>
                <button
                  onClick={() => setShowAdmin(false)}
                  className="mb-4 text-sm text-gray-600 hover:text-brand-500"
                >
                  ← Back to Calculator
                </button>
                <AdminDashboard />
              </div>
            ) : (
              <>
                {!hasSubmittedLead ? (
                  <LeadForm onSubmit={handleLeadSubmit} />
                ) : (
                  <AIVsHumanCalculator />
                )}
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full text-center">
                <h2 className="text-2xl font-semibold mb-4">Welcome to AI Cost Calculator</h2>
                <p className="text-gray-600 mb-8">Sign in to access the calculator and see how much you can save.</p>
                <Button onClick={handleSignIn}>
                  Sign In with Google
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
