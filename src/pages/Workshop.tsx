
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MiniWorkshop } from '@/components/calculator/workshop/MiniWorkshop';
import { LeadData } from '@/components/calculator/types';
import { Header } from '@/components/Header';

const Workshop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [workshopData, setWorkshopData] = useState<{
    leadData: LeadData;
    aiType: string;
    tierName: string;
  } | null>(null);

  useEffect(() => {
    // Get workshop data from location state
    const state = location.state as {
      leadData?: LeadData;
      aiType?: string;
      tierName?: string;
    } | null;

    if (state?.leadData && state?.aiType && state?.tierName) {
      setWorkshopData({
        leadData: state.leadData,
        aiType: state.aiType,
        tierName: state.tierName,
      });
    } else {
      // If no data is provided, redirect back to the calculator
      console.log("No workshop data found, redirecting to home page");
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Your AI Implementation Workshop
          </h1>
          <p className="text-center text-gray-600 mb-8">
            This personalized workshop will guide you through implementing AI in your business.
          </p>
          
          {workshopData ? (
            <MiniWorkshop
              leadData={workshopData.leadData}
              aiType={workshopData.aiType}
              tierName={workshopData.tierName}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading workshop content...</p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-brand-600 hover:text-brand-800 font-medium transition-colors duration-200"
            >
              Return to Calculator
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Workshop;
