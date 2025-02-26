
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Logo and Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="bg-brand-500 p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Compass className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Supercharge Your Business with AI
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover how AI can transform your operations. Calculate your potential savings 
              and see the impact on your bottom line.
            </p>
          </div>

          {/* Value Proposition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="calculator-card transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Time Savings</h3>
              <p className="text-gray-600 mb-4">Cut response times by up to 80% with AI-powered automation</p>
              <div className="bg-gradient-to-br from-brand-100 to-brand-50 p-6 rounded-xl">
                <img src="/placeholder.svg" alt="Time savings illustration" className="w-full h-32 object-contain" />
              </div>
            </div>
            <div className="calculator-card transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cost Efficiency</h3>
              <p className="text-gray-600 mb-4">Reduce operational costs by up to 60% with smart AI solutions</p>
              <div className="bg-gradient-to-br from-brand-100 to-brand-50 p-6 rounded-xl">
                <img src="/placeholder.svg" alt="Cost reduction illustration" className="w-full h-32 object-contain" />
              </div>
            </div>
            <div className="calculator-card transform hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Productivity Boost</h3>
              <p className="text-gray-600 mb-4">Increase team efficiency by up to 40% with AI assistance</p>
              <div className="bg-gradient-to-br from-brand-100 to-brand-50 p-6 rounded-xl">
                <img src="/placeholder.svg" alt="Productivity boost illustration" className="w-full h-32 object-contain" />
              </div>
            </div>
          </div>

          {/* Calculator Section */}
          <div className="mb-16">
            <div className="calculator-card">
              <div className="text-center max-w-3xl mx-auto mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Calculate Your AI Savings
                </h2>
                <p className="text-lg text-gray-600">
                  Use our interactive calculator to see how much your business could save with AI automation
                </p>
              </div>

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
