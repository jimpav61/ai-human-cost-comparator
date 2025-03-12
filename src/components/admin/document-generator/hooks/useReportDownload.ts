
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCalculatorInputs } from "@/hooks/calculator/supabase-types";
import { ensureCalculationResults } from "@/components/calculator/pdf/types";
import { performCalculations } from "@/hooks/calculator/calculations";
import { toJson } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------");
      console.log("Lead data for report:", lead);
      
      // Generate a new report ID
      const reportId = crypto.randomUUID();
      
      // Ensure we're using the latest lead data for the report
      console.log("Generating new report with latest lead data");
      
      // Ensure calculator_inputs and calculator_results are properly prepared
      const calculatorInputs = lead.calculator_inputs || {};
      const calculatorResults = lead.calculator_results || {};
      
      // Extract key data points
      const aiTier = calculatorInputs.aiTier || calculatorResults.tierKey || 'growth';
      const aiType = calculatorInputs.aiType || calculatorResults.aiType || 'chatbot';
      
      // Determine additional voice minutes
      let additionalVoiceMinutes = 0;
      if ('additionalVoiceMinutes' in calculatorResults) {
        additionalVoiceMinutes = Number(calculatorResults.additionalVoiceMinutes);
      } else if ('callVolume' in calculatorInputs) {
        additionalVoiceMinutes = Number(calculatorInputs.callVolume);
      }
      
      console.log("Using tierKey:", aiTier);
      console.log("Using aiType:", aiType);
      console.log("Using additionalVoiceMinutes:", additionalVoiceMinutes);
      
      // Ensure 1:1 replacement model by setting numEmployees to 1
      const adjustedInputs = { ...calculatorInputs, numEmployees: 1 };
      
      // Recalculate results to ensure consistency
      try {
        const validInputs = ensureCalculatorInputs(adjustedInputs);
        const recalculatedResults = performCalculations(validInputs, {});
        
        // Update calculator_results with recalculated values
        calculatorResults.humanCostMonthly = recalculatedResults.humanCostMonthly;
        calculatorResults.monthlySavings = recalculatedResults.monthlySavings;
        calculatorResults.yearlySavings = recalculatedResults.yearlySavings;
        calculatorResults.savingsPercentage = recalculatedResults.savingsPercentage;
        
        // Make sure aiType and tierKey are set correctly
        calculatorResults.aiType = aiType;
        calculatorResults.tierKey = aiTier;
        calculatorResults.additionalVoiceMinutes = additionalVoiceMinutes;
      } catch (calcError) {
        console.error("Error recalculating results:", calcError);
        // Continue with existing results if recalculation fails
      }
      
      // Create a typed CalculationResults object
      const typedCalculatorResults = ensureCalculationResults(calculatorResults);
      
      // Format tier and AI type display names
      const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                      aiTier === 'growth' ? 'Growth Plan' : 
                      aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                      
      const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                            aiType === 'voice' ? 'Basic Voice' : 
                            aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                            aiType === 'both' ? 'Text & Basic Voice' : 
                            aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      // Generate the PDF
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: typedCalculatorResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
        includedVoiceMinutes: aiTier === 'starter' ? 0 : 600,
        businessSuggestions: [
          {
            title: "Automate Common Customer Inquiries",
            description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
          },
          {
            title: "Enhance After-Hours Support",
            description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
          },
          {
            title: "Streamline Onboarding Process",
            description: "Use AI assistants to guide new customers through product setup and initial questions."
          }
        ],
        aiPlacements: [
          {
            role: "Front-line Customer Support",
            capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
          },
          {
            role: "Technical Troubleshooting",
            capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
          },
          {
            role: "Sales Assistant",
            capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
          }
        ],
        tierName: tierName,
        aiType: aiTypeDisplay
      });
      
      // Save a copy of this report to the database
      try {
        // Convert calculator data to JSON format
        const jsonInputs = toJson(adjustedInputs);
        const jsonResults = toJson(calculatorResults);
        
        // Create the report data
        const reportData = {
          id: reportId,
          contact_name: lead.name,
          company_name: lead.company_name,
          email: lead.email,
          phone_number: lead.phone_number || null,
          calculator_inputs: jsonInputs,
          calculator_results: jsonResults,
          report_date: new Date().toISOString()
        };
        
        console.log("Saving new report to database with ID:", reportData.id);
        
        const { error } = await supabase
          .from('generated_reports')
          .insert(reportData);
          
        if (error) {
          console.error("Error saving report to database:", error);
        } else {
          console.log("Report saved successfully with ID:", reportId);
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
      }
      
      // Save the PDF for download
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "The latest report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate report.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return {
    isLoading,
    handleDownloadReport
  };
};
