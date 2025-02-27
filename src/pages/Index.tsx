
import { useState } from 'react';
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import Header from "@/components/Header";
import { LeadForm, type LeadFormData } from "@/components/LeadForm";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [leadData, setLeadData] = useState<LeadFormData | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLeadSubmit = (data: LeadFormData) => {
    setLeadData(data);
    setShowCalculator(true);
    toast({
      title: "Welcome " + data.name + "!",
      description: "Now you can explore detailed AI cost savings for your business.",
    });
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For direct login (not registration)
      if (!isRegistering) {
        const { error } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword,
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        
        // Directly navigate to admin page
        window.location.href = '/admin';
        return;
      }
      
      // For registration flow - the redirectUrl is now handled by the Supabase client config
      const { error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Admin account created successfully. Please check your email to verify your account.",
      });
      
      setShowAdminForm(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AiGent Compass</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Strategic AI Integration Calculator for Modern Business Operations
            </p>
          </div>

          {/* Sample ROI Showcase */}
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Real Business Impact
            </h2>
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-lg p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-500 mb-2">65%</div>
                  <p className="text-gray-600">Average Cost Reduction</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-500 mb-2">24/7</div>
                  <p className="text-gray-600">Continuous Operation</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-500 mb-2">3.5x</div>
                  <p className="text-gray-600">Increased Efficiency</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI Placement and Function Overview */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="calculator-card p-6 h-full">
              <div className="text-brand-500 mb-4 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">Voice AI Assistants</h3>
              <p className="text-gray-600 mb-6 text-center">
                Handle customer calls 24/7 with natural voice interactions. Perfect for:
              </p>
              <ul className="text-gray-600 space-y-3">
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customer support inquiries
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Appointment scheduling
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic troubleshooting
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Information requests
                </li>
              </ul>
            </div>

            <div className="calculator-card p-6 h-full">
              <div className="text-brand-500 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">Chat AI Assistants</h3>
              <p className="text-gray-600 mb-6 text-center">
                Instant messaging support for websites and apps. Ideal for:
              </p>
              <ul className="text-gray-600 space-y-3">
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time customer service
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Product inquiries
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Order tracking
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  FAQ handling
                </li>
              </ul>
            </div>

            <div className="calculator-card p-6 h-full">
              <div className="text-brand-500 mb-4 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">ROI Benefits</h3>
              <p className="text-gray-600 mb-6 text-center">
                Key advantages of AI integration:
              </p>
              <ul className="text-gray-600 space-y-3">
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 Availability
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Instant Response Times
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Scalable Operations
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Consistent Service Quality
                </li>
              </ul>
            </div>
          </div>
          
          {!showCalculator ? (
            <LeadForm onSubmit={handleLeadSubmit} />
          ) : (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome, {leadData?.name}!
                </h2>
                <p className="text-gray-600">
                  Let's calculate potential AI savings for {leadData?.companyName} in the {leadData?.industry} industry
                </p>
              </div>
              <AIVsHumanCalculator leadData={leadData!} />
            </div>
          )}

          {/* Footer Links */}
          <div className="mt-16 text-center">
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
              <a 
                href="https://chatsites.ai/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-500 transition-colors"
              >
                Terms of Service
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="https://chatsites.ai/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-500 transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="https://chatsites.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-500 transition-colors"
              >
                Powered by ChatSites.ai
              </a>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowAdminForm(!showAdminForm)}
                className="text-gray-600 hover:text-brand-500 transition-colors text-sm"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Admin Form Modal */}
          {showAdminForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Admin {isRegistering ? 'Registration' : 'Login'}</h3>
                  <button 
                    onClick={() => setShowAdminForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleAdminAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Processing..." : (isRegistering ? "Register" : "Login")}
                  </Button>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setIsRegistering(!isRegistering)}
                      className="text-sm text-brand-500 hover:underline"
                    >
                      {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
