
import React, { useState, useEffect } from 'react';
import { ResultsSummary } from './ResultsSummary';
import { ResultsDetailView } from './ResultsDetailView';
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from './pricingDetailsCalculator';
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';
import type { LeadData } from './types';
import { generateAndDownloadReport } from '@/utils/report/generateReport';
import { Lead } from '@/types/leads';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toJson } from "@/hooks/calculator/supabase-types";

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
  inputs: CalculatorInputs;
  leadData: LeadData;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated,
  inputs,
  leadData,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const pricingDetails = calculatePricingDetails(inputs);
  const tierDisplayName = getTierDisplayName(inputs.aiTier);
  const aiTypeDisplay = getAITypeDisplay(inputs.aiType);
  
  // For debugging
  useEffect(() => {
    console.log("ResultsDisplay - Lead ID:", leadData.id);
    console.log("ResultsDisplay - Inputs:", inputs);
    console.log("ResultsDisplay - Results:", results);
    console.log("ResultsDisplay - PricingDetails:", pricingDetails);
  }, [inputs, results, pricingDetails, leadData]);
  
  // Create a Lead object from the leadData and calculator results
  // Use a real UUID if no ID exists
  const leadForReport: Lead = {
    id: leadData.id || crypto.randomUUID(),
    name: leadData.name,
    company_name: leadData.companyName,
    email: leadData.email,
    phone_number: leadData.phoneNumber || '',
    website: leadData.website || '',
    industry: leadData.industry || '',
    employee_count: leadData.employeeCount || 0,
    calculator_inputs: inputs as any,
    calculator_results: results as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    proposal_sent: false,
    form_completed: true
  };

  const handleDownloadReport = async () => {

    console.log(" **************************** Lead 2: ");

    return;
    try {
      setIsDownloading(true);
      console.log("Downloading report with lead ID:", leadForReport.id);
      console.log("Full lead object for report:", JSON.stringify(leadForReport));
      
      // First ensure the lead exists in the database
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadForReport.id)
        .single();
      
      if (checkError || !existingLead) {
        console.log("Lead doesn't exist in database yet, creating it first");
        
        // Create the lead first to ensure it exists
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert({
            id: leadForReport.id,
            name: leadForReport.name,
            company_name: leadForReport.company_name,
            email: leadForReport.email,
            phone_number: leadForReport.phone_number,
            website: leadForReport.website,
            industry: leadForReport.industry,
            employee_count: leadForReport.employee_count,
            calculator_inputs: toJson(leadForReport.calculator_inputs),
            calculator_results: toJson(leadForReport.calculator_results),
            proposal_sent: false,
            form_completed: true
          })
          .select();
        
        if (createError) {
          console.error("Error creating lead:", createError);
          throw new Error("Failed to create lead before generating report");
        }
        
        console.log("Lead created successfully:", newLead);
      }
      
      // Now generate and download the report
      await generateAndDownloadReport(leadForReport);
      setIsDownloading(false);
      
      toast({
        title: "Report Downloaded",
        description: "Your ROI report has been successfully downloaded.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      setIsDownloading(false);
      
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-fadeIn">
      <ResultsSummary
        results={results}
        reportGenerated={reportGenerated}
        handleGenerateReport={onGenerateReport}
        tierDisplayName={tierDisplayName}
        aiTypeDisplay={aiTypeDisplay}
      />

      {reportGenerated && (
        <div className="mt-4">
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isDownloading ? "Processing..." : "Download Detailed Report"}
          </button>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-brand-600 hover:text-brand-800 font-medium transition-colors duration-200"
        >
          {showDetails ? 'Hide Details' : 'View Detailed Breakdown'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4">
          <ResultsDetailView
            results={results}
            inputs={inputs}
            pricingDetails={pricingDetails}
            tierDisplayName={tierDisplayName}
            aiTypeDisplay={aiTypeDisplay}
          />
        </div>
      )}
    </div>
  );
};
