
import { useState } from 'react';
import Header from "@/components/Header";
import { toast } from "@/components/ui/use-toast";
import type { LeadFormData } from "@/components/LeadForm";
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
    });
  };

  const handleAdminClick = () => {
    // Navigate to admin page
    window.location.href = '/admin';
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Hero />
          <ROIShowcase />
          <AIFeatures />
          <CalculatorSection 
            showCalculator={showCalculator}
            leadData={leadData}
            onLeadSubmit={handleLeadSubmit}
          />
          <Footer onAdminClick={handleAdminClick} />
        </div>
      </div>
    </>
  );
};

export default Index;
