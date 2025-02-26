
import { useState } from 'react';
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import Header from "@/components/Header";
import { LeadForm, type LeadFormData } from "@/components/LeadForm";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [leadData, setLeadData] = useState<LeadFormData | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);

  const handleLeadSubmit = (data: LeadFormData) => {
    setLeadData(data);
    setShowCalculator(true);
    toast({
      title: "Welcome " + data.name + "!",
      description: "Now you can explore detailed AI cost savings for your business.",
    });
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
            <div className="calculator-card p-6">
              <div className="text-brand-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Voice AI Assistants</h3>
              <p className="text-gray-600 mb-4">
                Handle customer calls 24/7 with natural voice interactions. Perfect for:
              </p>
              <ul className="text-gray-600 text-left space-y-2">
                <li>• Customer support inquiries</li>
                <li>• Appointment scheduling</li>
                <li>• Basic troubleshooting</li>
                <li>• Information requests</li>
              </ul>
            </div>

            <div className="calculator-card p-6">
              <div className="text-brand-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Chat AI Assistants</h3>
              <p className="text-gray-600 mb-4">
                Instant messaging support for websites and apps. Ideal for:
              </p>
              <ul className="text-gray-600 text-left space-y-2">
                <li>• Real-time customer service</li>
                <li>• Product inquiries</li>
                <li>• Order tracking</li>
                <li>• FAQ handling</li>
              </ul>
            </div>

            <div className="calculator-card p-6">
              <div className="text-brand-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">ROI Benefits</h3>
              <p className="text-gray-600 mb-4">
                Key advantages of AI integration:
              </p>
              <ul className="text-gray-600 text-left space-y-2">
                <li>• 24/7 Availability</li>
                <li>• Instant Response Times</li>
                <li>• Scalable Operations</li>
                <li>• Consistent Service Quality</li>
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
                  Let's calculate potential AI savings for {leadData?.companyName}
                </p>
              </div>
              <AIVsHumanCalculator />
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
                  <h3 className="text-lg font-semibold">Admin Access</h3>
                  <button 
                    onClick={() => setShowAdminForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                {/* Add your admin form content here */}
                <p className="text-gray-600">Please contact support for admin access.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
