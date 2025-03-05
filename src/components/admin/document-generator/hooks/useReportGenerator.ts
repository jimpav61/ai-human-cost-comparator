
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
      
      // Extract calculator results with fallbacks to ensure we always have a valid structure
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      // Create a properly structured aiCostMonthly object, ensuring it always exists
      const aiCostMonthly = {
        voice: 0,
        chatbot: 0,
        total: 0,
        setupFee: 0,
        ...(typeof calculatorResults.aiCostMonthly === 'object' ? calculatorResults.aiCostMonthly : {})
      };
      
      console.log("Structured aiCostMonthly for report:", aiCostMonthly);
      
      // Get the additional voice minutes from inputs if available
      const additionalVoiceMinutes = calculatorInputs?.callVolume || 0;
      console.log("Additional voice minutes detected:", additionalVoiceMinutes);
      
      // Prepare a clean, valid results object with fallbacks for all required properties
      const safeResults = {
        aiCostMonthly,
        basePriceMonthly: calculatorResults.basePriceMonthly || aiCostMonthly.chatbot || 99,
        humanCostMonthly: calculatorResults.humanCostMonthly || 5000,
        monthlySavings: calculatorResults.monthlySavings || 4000,
        yearlySavings: calculatorResults.yearlySavings || 48000,
        savingsPercentage: calculatorResults.savingsPercentage || 80,
        // Add the missing properties with fallback values
        breakEvenPoint: calculatorResults.breakEvenPoint || { voice: 0, chatbot: 0 },
        humanHours: calculatorResults.humanHours || {
          dailyPerEmployee: 8,
          weeklyTotal: 40,
          monthlyTotal: 160,
          yearlyTotal: 2080
        },
        annualPlan: calculatorResults.annualPlan || 999
      };
      
      console.log("Using safe results structure:", safeResults);
      
      // Generate PDF using the safe results structure
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
          'Premium Plan') : 'Growth Plan', // Provide default
        aiType: calculatorInputs?.aiType ? 
          (calculatorInputs.aiType === 'chatbot' ? 'Text Only' : 
          calculatorInputs.aiType === 'voice' ? 'Basic Voice' : 
          calculatorInputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
          calculatorInputs.aiType === 'both' ? 'Text & Basic Voice' : 
          calculatorInputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only') : 'Text Only', // Provide default
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
