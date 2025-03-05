
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName, saveReportPDF } from "./report-generator/saveReport";

interface UseReportGeneratorProps {
  lead: Lead;
}

export const useReportGenerator = ({ lead }: UseReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedReports',
    leadId: lead.id
  });

  const generateReportDocument = async () => {
    try {
      console.log('Generating report for lead:', lead);
      
      // Check if lead exists
      if (!lead) {
        throw new Error("Lead data is missing");
      }

      // CRITICAL: Use the EXACTLY SAME approach as frontend ResultsDisplay.tsx
      // We must use exactly the same code path as the frontend to ensure identical PDFs
      const calculatorResults = lead.calculator_results;
      const calculatorInputs = lead.calculator_inputs;
      
      if (!calculatorResults || !calculatorInputs) {
        throw new Error("Calculator data is missing from lead");
      }
      
      console.log("Using EXACT frontend calculator results for PDF generation:", calculatorResults);
      
      // Get the exact display names as used in the frontend
      const tierName = calculatorInputs.aiTier === 'starter' ? 'Starter Plan' : 
                      calculatorInputs.aiTier === 'growth' ? 'Growth Plan' : 
                      calculatorInputs.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                     
      const aiType = calculatorInputs.aiType === 'chatbot' ? 'Text Only' : 
                    calculatorInputs.aiType === 'voice' ? 'Basic Voice' : 
                    calculatorInputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                    calculatorInputs.aiType === 'both' ? 'Text & Basic Voice' : 
                    calculatorInputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      // EXACT SAME CODE PATH: Use the generatePDF function with exactly the same parameters
      // as used in the frontend ResultsDisplay.tsx
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        // Pass EXACTLY the same calculator results without ANY modification
        results: calculatorResults,
        additionalVoiceMinutes: Number(calculatorInputs.callVolume) || 0,
        includedVoiceMinutes: calculatorInputs.aiTier === 'starter' ? 0 : 600,
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
        aiType: aiType,
      });
      
      console.log("PDF generation completed using IDENTICAL code path as frontend");
      
      // Save the PDF using the exact same method
      saveReportPDF(doc, lead);
      
      // Mark as downloaded
      markAsDownloaded();
      
      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    hasDownloaded,
    generateReportDocument
  };
};
