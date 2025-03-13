
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
      console.log('Lead ID for report download:', lead.id);
      
      // Fetch the latest report for this lead
      const { data: reports, error: fetchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', lead.id)
        .order('version', { ascending: false })
        .limit(1);
      
      if (fetchError) {
        throw new Error(`Failed to fetch report: ${fetchError.message}`);
      }
      
      if (!reports || reports.length === 0) {
        // Handle case where no report exists yet - show a toast instead of throwing an error
        console.log('No report found for this lead.');
        toast({
          title: "No Report Available",
          description: "No report has been generated for this lead yet. Please generate a report first.",
          variant: "warning",
        });
        setIsLoading(false);
        return;
      }
      
      const latestReport = reports[0];
      console.log('Found latest report:', latestReport.id, 'version:', latestReport.version);
      
      // Generate safe filename for the report
      const safeCompanyName = getSafeFileName(lead);
      const versionLabel = latestReport.version ? `-v${latestReport.version}` : '';
      const fileName = `${safeCompanyName}-ChatSites-ROI-Report${versionLabel}.pdf`;
      
      // Extract the stored calculator data and ensure it's parsed correctly from JSON
      const calculatorResults = typeof latestReport.calculator_results === 'string' 
        ? JSON.parse(latestReport.calculator_results) 
        : latestReport.calculator_results;
      
      if (!calculatorResults) {
        throw new Error("Report data is incomplete. Please generate a new report.");
      }
      
      console.log('Parsed calculator results:', calculatorResults);
      
      // Ensure the calculator results have the correct structure
      const validatedResults: CalculationResults = ensureCompleteCalculatorResults(calculatorResults);
      
      // Generate the PDF using the stored calculator results
      const doc = generatePDF({
        contactInfo: latestReport.contact_name || lead.name || 'Valued Client',
        companyName: latestReport.company_name || lead.company_name || 'Your Company',
        email: latestReport.email || lead.email || 'client@example.com',
        phoneNumber: latestReport.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: validatedResults,
        additionalVoiceMinutes: validatedResults.additionalVoiceMinutes || 0,
        includedVoiceMinutes: validatedResults.includedVoiceMinutes || 600,
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
        tierName: validatedResults.tierKey === 'starter' ? 'Starter Plan' : 
                 validatedResults.tierKey === 'growth' ? 'Growth Plan' : 
                 validatedResults.tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: validatedResults.aiType === 'chatbot' ? 'Text Only' : 
               validatedResults.aiType === 'voice' ? 'Basic Voice' : 
               validatedResults.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
               validatedResults.aiType === 'both' ? 'Text & Basic Voice' : 
               validatedResults.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save the PDF with the proper name
      doc.save(fileName);
      
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to download report.",
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
