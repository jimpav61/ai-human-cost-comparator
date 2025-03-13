
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
      console.log('Lead ID for report download:', lead.id);
      
      // Query for reports with this lead ID, without any ordering
      const { data: reports, error: fetchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', lead.id);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Failed to fetch report: ${fetchError.message}`);
      }
      
      console.log('Reports found:', reports ? reports.length : 0);
      
      if (!reports || reports.length === 0) {
        console.error('No reports found for lead ID:', lead.id);
        
        // Show all reports for debugging
        const { data: allReports } = await supabase
          .from('generated_reports')
          .select('id, lead_id, company_name')
          .limit(20);
        
        console.log('First 20 reports in database:', allReports);
        
        toast({
          title: "No Report Available",
          description: "No report was found for this lead. Please generate a report first.",
          variant: "warning",
        });
        
        setIsLoading(false);
        return;
      }
      
      // Get the report (first one if multiple exist)
      const report = reports[0];
      console.log('Using report:', {
        id: report.id,
        leadId: report.lead_id,
        companyName: report.company_name,
        contactName: report.contact_name
      });
      
      // Generate safe filename for the report
      const safeCompanyName = getSafeFileName(lead);
      const fileName = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
      
      console.log('Generating PDF from saved report data');
      
      // Parse calculator results from JSON string if needed
      let calculatorResultsData;
      if (typeof report.calculator_results === 'string') {
        try {
          calculatorResultsData = JSON.parse(report.calculator_results);
          console.log('Parsed calculator results from JSON string');
        } catch (e) {
          console.error('Error parsing calculator_results JSON:', e);
          calculatorResultsData = report.calculator_results;
        }
      } else {
        calculatorResultsData = report.calculator_results;
      }
      
      console.log('Calculator results data type:', typeof calculatorResultsData);
      
      // Validate and ensure the calculator results have the correct structure
      const validatedResults = ensureCompleteCalculatorResults(calculatorResultsData);
      
      // Generate the PDF using the stored calculator results
      const doc = generatePDF({
        contactInfo: report.contact_name || lead.name || 'Valued Client',
        companyName: report.company_name || lead.company_name || 'Your Company',
        email: report.email || lead.email || 'client@example.com',
        phoneNumber: report.phone_number || lead.phone_number || '',
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
      console.log('Report download successful, saving as:', fileName);
      
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
