
import React from 'react';
import AIFeatureCard from './AIFeatureCard';

const AIFeatures: React.FC = () => {
  return (
    <div className="mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AIFeatureCard
        title="Voice AI Assistants"
        icon={
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
        }
        description="Handle customer calls 24/7 with natural voice interactions. Perfect for:"
        features={[
          "Customer support inquiries",
          "Appointment scheduling",
          "Basic troubleshooting",
          "Information requests"
        ]}
      />
      <AIFeatureCard
        title="Chat AI Assistants"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        }
        description="Instant messaging support for websites and apps. Ideal for:"
        features={[
          "Real-time customer service",
          "Product inquiries",
          "Order tracking",
          "FAQ handling"
        ]}
      />
      <AIFeatureCard
        title="ROI Benefits"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
        description="Key advantages of AI integration:"
        features={[
          "24/7 Availability",
          "Instant Response Times",
          "Scalable Operations",
          "Consistent Service Quality"
        ]}
      />
    </div>
  );
};

export default AIFeatures;
