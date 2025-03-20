
import React from 'react';
import AIFeatureCard from './AIFeatureCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";

const AIFeatures: React.FC = () => {
  const isMobile = useIsMobile();
  
  const features = [
    {
      title: "Text AI Assistants",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      description: "Instant messaging support for websites and apps. Ideal for:",
      features: [
        "Real-time customer service",
        "Product inquiries",
        "Order tracking",
        "FAQ handling"
      ]
    },
    {
      title: "Basic Voice AI",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-10 w-10" 
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
      ),
      description: "Handle basic customer calls with scripted responses:",
      features: [
        "Pre-recorded voice responses",
        "Simple call routing",
        "Basic information gathering",
        "Ideal for simple interactions"
      ]
    },
    {
      title: "Conversational Voice AI",
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-10 w-10" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
        </svg>
      ),
      description: "Natural, flowing conversations with customers:",
      features: [
        "Human-like conversations",
        "Complex problem solving",
        "Multi-turn interactions",
        "Customer sentiment analysis"
      ]
    }
  ];

  // For desktop, use grid layout
  if (!isMobile) {
    return (
      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <AIFeatureCard
            key={index}
            title={feature.title}
            icon={feature.icon}
            description={feature.description}
            features={feature.features}
          />
        ))}
      </div>
    );
  }
  
  // For mobile, use carousel
  return (
    <div className="mb-10">
      <Carousel className="w-full">
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index}>
              <AIFeatureCard
                title={feature.title}
                icon={feature.icon}
                description={feature.description}
                features={feature.features}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center mt-4">
          <CarouselPrevious className="relative static mx-2 translate-y-0" />
          <CarouselNext className="relative static mx-2 translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default AIFeatures;
