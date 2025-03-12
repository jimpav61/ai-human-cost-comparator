
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { toJson } from "@/hooks/calculator/supabase-types";
import { CalculationResults } from "@/hooks/calculator/types";

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
      
      // Extract necessary values directly from calculator results
      const results = lead.calculator_results as CalculationResults;
      const setupFee = results?.aiCostMonthly?.setupFee || 0;
      
      // Make sure we extract the additional voice minutes correctly
      const additionalVoiceMinutes = 
        // First try from calculator_results.additionalVoiceMinutes
        (results?.additionalVoiceMinutes) || 
        // Then from calculator_inputs.callVolume 
        (lead.calculator_inputs?.callVolume) || 
        // Fallback to 0
        0;
      
      console.log("Using additionalVoiceMinutes:", additionalVoiceMinutes);
      console.log("Using setupFee:", setupFee);
      
      // Generate the PDF with EXPLICITLY passed additionalVoiceMinutes and included minutes
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: results,
        additionalVoiceMinutes: additionalVoiceMinutes,
        includedVoiceMinutes: results?.tierKey === 'starter' ? 0 : 600,
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
        tierName: results?.tierKey === 'starter' ? 'Starter Plan' : 
                 results?.tierKey === 'growth' ? 'Growth Plan' : 
                 results?.tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: results?.aiType === 'chatbot' ? 'Text Only' : 
                results?.aiType === 'voice' ? 'Basic Voice' : 
                results?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                results?.aiType === 'both' ? 'Text & Basic Voice' : 
                results?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save a copy of this report to the database
      try {
        const jsonInputs = toJson(lead.calculator_inputs);
        
        // Make sure additionalVoiceMinutes is in the results before saving
        if (results && typeof results === 'object') {
          results.additionalVoiceMinutes = additionalVoiceMinutes;
        }
        
        const jsonResults = toJson(results || lead.calculator_results);
        
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
        console.log("Report data includes additionalVoiceMinutes:", additionalVoiceMinutes);
        console.log("Report data includes setupFee:", setupFee);
        
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
