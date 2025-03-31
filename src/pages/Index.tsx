
import { useState } from 'react';
import Header from "@/components/Header";
import { toast } from "@/components/ui/use-toast";
import type { LeadFormData } from "@/components/lead-form";
import Hero from "@/components/home/Hero";
import ROIShowcase from "@/components/home/ROIShowcase";
import AIFeatures from "@/components/home/AIFeatures";
import Footer from "@/components/home/Footer";
import CalculatorSection from "@/components/home/CalculatorSection";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [leadData, setLeadData] = useState<LeadFormData | null>(null);

  const handleLeadSubmit = (data: LeadFormData) => {
    setLeadData(data);
    setShowCalculator(true);
    toast({
      title: "Welcome " + data.name + "!",
      description: "Now you can explore detailed AI cost savings for your business.",
      duration: 1000, // Set duration to 1000ms (1 second)
    });
  };
  
  const handleAdminClick = () => {
    try {
      window.location.href = '/admin';
    } catch (e) {
      console.error("Navigation error:", e);
      
      const a = document.createElement('a');
      a.href = '/admin';
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!showCalculator && <Hero />}
          
          {!showCalculator && (
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Get Your Free AI Savings Report
              </h2>
              <p className="text-gray-600 mb-6">
                Fill out the form below to receive a personalized analysis of how AI can benefit your business
              </p>
              <CalculatorSection 
                showCalculator={false}
                leadData={leadData}
                onLeadSubmit={handleLeadSubmit}
              />
              <ROIShowcase />
            </div>
          )}
          
          {!showCalculator && <AIFeatures />}
          
          {showCalculator && (
            <CalculatorSection 
              showCalculator={true}
              leadData={leadData}
              onLeadSubmit={handleLeadSubmit}
            />
          )}
          
          <Footer onAdminClick={handleAdminClick} />
        </div>
      </div>
    </>
  );
};

export default Index;
