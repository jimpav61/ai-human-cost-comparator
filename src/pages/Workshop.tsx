
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MiniWorkshop } from '@/components/calculator/workshop/MiniWorkshop';
import { LeadData } from '@/components/calculator/types';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const Workshop = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workshopData, setWorkshopData] = useState<{
    leadData: LeadData;
    aiType: string;
    tierName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeadData = async (leadId: string) => {
      try {
        setIsLoading(true);
        // Fetch the lead data from Supabase using the lead ID
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (error || !data) {
          console.error("Error fetching lead data:", error);
          navigate('/');
          return;
        }

        // Extract the needed data
        const leadData: LeadData = {
          id: data.id,
          name: data.name,
          companyName: data.company_name,
          email: data.email,
          phoneNumber: data.phone_number,
          website: data.website,
          industry: data.industry,
          employeeCount: data.employee_count,
          calculator_results: typeof data.calculator_results === 'string' 
            ? JSON.parse(data.calculator_results) 
            : data.calculator_results
        };

        // Get AI type and tier name from calculator results
        const aiType = leadData.calculator_results?.aiType || data.calculator_inputs?.aiType || 'chatbot';
        const tierName = leadData.calculator_results?.tierKey || data.calculator_inputs?.aiTier || 'starter';

        setWorkshopData({
          leadData,
          aiType,
          tierName
        });
      } catch (error) {
        console.error("Error in fetchLeadData:", error);
        toast({
          title: "Error",
          description: "Could not load workshop data. Redirecting to home page.",
          variant: "destructive",
          duration: 1500,
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    // First try to get data from location state
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
      setIsLoading(false);
    } else {
      // If no state data, try to get lead ID from URL parameters
      const leadId = searchParams.get('leadId');
      if (leadId) {
        fetchLeadData(leadId);
      } else {
        console.log("No workshop data or lead ID found, redirecting to home page");
        navigate('/');
      }
    }
  }, [location, navigate, searchParams]);

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
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Loading workshop content...</p>
            </div>
          ) : workshopData ? (
            <MiniWorkshop
              leadData={workshopData.leadData}
              aiType={workshopData.aiType}
              tierName={workshopData.tierName}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No workshop data available. Please complete the calculator first.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-brand-600 hover:text-brand-800 font-medium transition-colors duration-200"
              >
                Return to Calculator
              </button>
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
