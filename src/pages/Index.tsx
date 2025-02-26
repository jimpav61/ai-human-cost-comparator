
import { AIVsHumanCalculator } from "@/components/AIVsHumanCalculator";
import Header from "@/components/Header";

const Index = () => {
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
          
          <AIVsHumanCalculator />
        </div>
      </div>
    </>
  );
};

export default Index;
