
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { CalculationResults, CalculatorInputs } from "@/hooks/calculator/types";
import { ensureCalculatorInputs, toJson } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
      console.log('Lead data for report:', lead);
      
      // Get the next version number for this lead
      const { data: existingReports, error: countError } = await supabase
        .from('generated_reports')
        .select('version')
        .eq('lead_id', lead.id)
        .order('version', { ascending: false })
        .limit(1);
        
      let nextVersion = 1;
      if (!countError && existingReports && existingReports.length > 0) {
        nextVersion = (existingReports[0].version || 0) + 1;
      }
      
      console.log("Creating new report version:", nextVersion);
      
      // Generate a new unique ID for this report version
      const reportId = crypto.randomUUID();
      console.log("Generated new report ID:", reportId);
      
      // IMPORTANT: Use the exact lead data without modifying anything
      console.log("Generating new report with exact lead data");
      
      // Extract data directly from lead without modifications and ensure they're typed correctly
      const calculatorInputs: CalculatorInputs = lead.calculator_inputs || {};
      const calculatorResults: CalculationResults = lead.calculator_results || {};
      
      // CRITICAL: Don't modify any values, use them exactly as is
      // Use optional chaining and nullish coalescing to safely access properties
      const aiTier = calculatorResults?.tierKey || calculatorInputs?.aiTier || 'growth';
      const aiType = calculatorResults?.aiType || calculatorInputs?.aiType || 'chatbot';
      const additionalVoiceMinutes = 
        calculatorResults?.additionalVoiceMinutes !== undefined ? Number(calculatorResults.additionalVoiceMinutes) :
        calculatorInputs?.callVolume !== undefined ? Number(calculatorInputs.callVolume) : 0;
      
      console.log("Using exact original values:");
      console.log("tierKey:", aiTier);
      console.log("aiType:", aiType);
      console.log("additionalVoiceMinutes:", additionalVoiceMinutes);
      
      // Format tier and AI type display names
      const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                      aiTier === 'growth' ? 'Growth Plan' : 
                      aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                      
      const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                          aiType === 'voice' ? 'Basic Voice' : 
                          aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                          aiType === 'both' ? 'Text & Basic Voice' : 
                          aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      // Generate the PDF with exact original values
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults,
        additionalVoiceMinutes,
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
        tierName,
        aiType: aiTypeDisplay
      });
      
      // Save a copy of this report to the database with EXACT original values
      try {
        // Simply convert to JSON without modifying
        const jsonInputs = toJson(calculatorInputs);
        const jsonResults = toJson(calculatorResults);
        
        // Create the report data with the generated UUID and lead reference
        const reportData = {
          id: reportId,
          lead_id: lead.id,
          contact_name: lead.name,
          company_name: lead.company_name,
          email: lead.email,
          phone_number: lead.phone_number || null,
          calculator_inputs: jsonInputs,
          calculator_results: jsonResults,
          report_date: new Date().toISOString(),
          version: nextVersion
        };
        
        console.log("Saving new report version to database:", reportData);
        
        // Insert the new report version
        const { error } = await supabase
          .from('generated_reports')
          .insert(reportData);
          
        if (error) {
          console.error("Error saving report to database:", error);
        } else {
          console.log("Report saved successfully with ID:", reportData.id, "and version:", nextVersion);
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
      }
      
      // Save the PDF for download
      const safeCompanyName = getSafeFileName(lead);
      const versionLabel = nextVersion ? `-v${nextVersion}` : '';
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report${versionLabel}.pdf`);
      
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
