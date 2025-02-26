
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIVsHumanCalculator } from '@/components/AIVsHumanCalculator';
import { LeadForm } from '@/components/LeadForm';
import { AdminDashboard } from '@/components/AdminDashboard';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Compass } from 'lucide-react';

const queryClient = new QueryClient();

export default function IndexPage() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
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
      if (isSignUp) {
        const { data: allowedAdmin } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', email.toLowerCase())
          .single();

        const { data: { user }, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password 
        });

        if (signUpError) throw signUpError;

        if (user && allowedAdmin) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: 'admin'
            });

          if (roleError) throw roleError;
        }

        toast({
          title: "Check your email",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });

        if (signInError) throw signInError;

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign Up Error" : "Sign In Error",
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Logo and Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="bg-brand-500 p-4 rounded-full">
                <Compass className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI Cost Calculator
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Calculate your potential savings by implementing AI solutions in your business operations
            </p>
          </div>

          {/* Savings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="calculator-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Savings</h3>
              <p className="text-gray-600">Reduce response times by up to 80% with AI automation</p>
              <img src="/placeholder.svg" alt="Time savings" className="mt-4 w-full h-32 object-cover rounded-lg" />
            </div>
            <div className="calculator-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cost Reduction</h3>
              <p className="text-gray-600">Lower operational costs by implementing AI solutions</p>
              <img src="/placeholder.svg" alt="Cost reduction" className="mt-4 w-full h-32 object-cover rounded-lg" />
            </div>
            <div className="calculator-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Efficiency Boost</h3>
              <p className="text-gray-600">Improve productivity with intelligent automation</p>
              <img src="/placeholder.svg" alt="Efficiency boost" className="mt-4 w-full h-32 object-cover rounded-lg" />
            </div>
          </div>

          {/* Sample and Calculator Section */}
          <div className="mb-16">
            <div className="calculator-card">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Try Our Calculator</h3>
              <p className="text-gray-600 mb-8">
                See how much you could save with AI automation. Input your details below to get started.
              </p>
              {session ? (
                <>
                  <div className="flex justify-end mb-4">
                    <Button variant="outline" onClick={handleSignOut} className="ml-2">
                      Sign Out
                    </Button>
                  </div>
                  {showAdmin && isAdmin ? (
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
                  )}
                  {!showAdmin && isAdmin && (
                    <div className="text-right mt-4">
                      <button
                        onClick={() => setShowAdmin(true)}
                        className="text-sm text-gray-600 hover:text-brand-500"
                      >
                        Admin Dashboard →
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <LeadForm onSubmit={handleLeadSubmit} />
                  <div className="flex justify-center mt-8">
                    {!showAdminForm ? (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAdminForm(true)}
                        className="text-sm text-gray-500"
                      >
                        Admin Access
                      </Button>
                    ) : (
                      <div className="max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-medium text-gray-700">Admin Access</h3>
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowAdminForm(false)}
                            className="text-sm text-gray-500"
                          >
                            Cancel
                          </Button>
                        </div>
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
                          <Button type="submit" variant="outline" className="w-full">
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                          </Button>
                        </form>
                        <button
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="mt-4 text-sm text-center w-full text-gray-500 hover:text-gray-700"
                        >
                          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
