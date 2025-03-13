
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
      
      // First check if lead has calculator results directly
      if (lead.calculator_results) {
        console.log('Lead has calculator results directly, using them');
        const calculatorResults = ensureCompleteCalculatorResults(lead.calculator_results);
        
        // Generate safe filename for the report
        const safeCompanyName = getSafeFileName(lead);
        const fileName = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
        
        // Generate the PDF using the lead's calculator results
        const doc = generatePDF({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number || '',
          industry: lead.industry || 'Other',
          employeeCount: Number(lead.employee_count) || 5,
          results: calculatorResults,
          additionalVoiceMinutes: calculatorResults.additionalVoiceMinutes || 0,
          includedVoiceMinutes: calculatorResults.includedVoiceMinutes || 600,
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
          tierName: calculatorResults.tierKey === 'starter' ? 'Starter Plan' : 
                  calculatorResults.tierKey === 'growth' ? 'Growth Plan' : 
                  calculatorResults.tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan',
          aiType: calculatorResults.aiType === 'chatbot' ? 'Text Only' : 
                calculatorResults.aiType === 'voice' ? 'Basic Voice' : 
                calculatorResults.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorResults.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorResults.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
        });
        
        // Save the PDF with the proper name
        doc.save(fileName);
        
        toast({
          title: "Report Downloaded",
          description: "The report has been successfully downloaded.",
          duration: 1000,
        });
        
        setIsLoading(false);
        return;
      }
      
      // If no direct results, try to fetch from generated_reports table
      console.log('Fetching report from generated_reports table');
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
        console.log('No report found in generated_reports table. Checking if we can generate one from lead data.');
        
        // As a final fallback, check if the lead has calculator_inputs that we can use to generate a report
        if (lead.calculator_inputs) {
          console.log('Lead has calculator_inputs, will attempt to generate a report from them');
          // This would require implementing a function to calculate results from inputs
          // For now, just inform the user
          toast({
            title: "Report Generation Required",
            description: "Please generate a report for this lead first using the Report Generator.",
            variant: "warning",
          });
        } else {
          toast({
            title: "No Report Available",
            description: "This lead has no calculator data. Please complete the calculator first.",
            variant: "warning",
          });
        }
        
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
      const calculatorResultsRaw = typeof latestReport.calculator_results === 'string' 
        ? JSON.parse(latestReport.calculator_results) 
        : latestReport.calculator_results;
        
      if (!calculatorResultsRaw) {
        throw new Error("Report data is incomplete. Please generate a new report.");
      }
      
      console.log('Parsed calculator results:', calculatorResultsRaw);
      
      // Ensure the calculator results have the correct structure
      const validatedResults = ensureCompleteCalculatorResults(calculatorResultsRaw);
      
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
