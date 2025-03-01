
import React from 'react';
import AIFeatureCard from './AIFeatureCard';

const AIFeatures: React.FC = () => {
  return (
    <div className="mb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AIFeatureCard
        title="Text AI Assistants"
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
        title="Basic Voice AI"
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
        description="Handle basic customer calls with scripted voice responses. Included with Growth Plan:"
        features={[
          "Pre-recorded voice responses",
          "Simple call routing",
          "Basic information gathering",
          "Limited to predefined scripts"
        ]}
      />
      <AIFeatureCard
        title="Conversational Voice AI"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          </svg>
        }
        description="Premium Plan: Natural, flowing conversations with customers. Perfect for:"
        features={[
          "Dynamic, human-like conversations",
          "Advanced call understanding",
          "Complex problem solving",
          "Natural dialogue flow",
          "Multi-turn conversations"
        ]}
      />
    </div>
  );
};

export default AIFeatures;
