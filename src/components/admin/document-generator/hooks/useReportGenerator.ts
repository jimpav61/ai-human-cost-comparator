
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
      
      // Extract calculator results and inputs directly from lead data
      // with minimal transformations to preserve original values
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      console.log("Calculator results for report:", calculatorResults);
      console.log("Calculator inputs for report:", calculatorInputs);
      
      // Only provide minimum required fallbacks when properties are completely missing
      // This ensures we display the exact same data as seen in the front-end
      const safeResults = {
        // Use the original values from calculator results when available
        ...calculatorResults,
        // Only provide fallbacks for completely missing required properties
        aiCostMonthly: calculatorResults.aiCostMonthly || {
          voice: 0,
          chatbot: 0,
          total: 0,
          setupFee: 0
        },
        breakEvenPoint: calculatorResults.breakEvenPoint || { 
          voice: 0, 
          chatbot: 0 
        },
        humanHours: calculatorResults.humanHours || {
          dailyPerEmployee: 8,
          weeklyTotal: 40,
          monthlyTotal: 160,
          yearlyTotal: 2080
        },
        annualPlan: calculatorResults.annualPlan || 0
      };
      
      console.log("Using preserved calculator results structure:", safeResults);
      
      // Get additional voice minutes directly from inputs
      const additionalVoiceMinutes = calculatorInputs?.callVolume || 0;
      
      // Generate PDF using the preserved results structure
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: lead.employee_count || 5,
        results: safeResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: calculatorInputs?.aiTier ? 
          (calculatorInputs.aiTier === 'starter' ? 'Starter Plan' : 
          calculatorInputs.aiTier === 'growth' ? 'Growth Plan' : 
          'Premium Plan') : 'Growth Plan',
        aiType: calculatorInputs?.aiType ? 
          (calculatorInputs.aiType === 'chatbot' ? 'Text Only' : 
          calculatorInputs.aiType === 'voice' ? 'Basic Voice' : 
          calculatorInputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
          calculatorInputs.aiType === 'both' ? 'Text & Basic Voice' : 
          calculatorInputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only') : 'Text Only',
      });
      
      console.log("PDF generation completed successfully");
      
      // Save the PDF
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
