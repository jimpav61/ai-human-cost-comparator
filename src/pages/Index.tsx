
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIVsHumanCalculator } from '@/components/AIVsHumanCalculator';
import { LeadForm } from '@/components/LeadForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const queryClient = new QueryClient();

export default function IndexPage() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkUserRole(session?.user?.id);
    });

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({
          title: isSignUp ? "Sign Up Error" : "Sign In Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Check your email" : "Welcome back!",
          description: isSignUp ? "Please check your email to verify your account." : "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
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
          {session ? (
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="ml-2"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isSignUp ? 'Create an Account' : 'Sign In'}
              </h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="mt-4 text-sm text-center w-full text-gray-600 hover:text-gray-900"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}

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
          ) : null}
        </div>
      </div>
    </QueryClientProvider>
  );
}
