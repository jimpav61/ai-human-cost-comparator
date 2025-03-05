
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName, saveReportPDF } from "./report-generator/saveReport";
import { HUMAN_HOURLY_RATES } from "@/constants/pricing";

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

      // CRITICAL: Need to provide default values if calculator data is missing
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      console.log("Using calculator results for PDF generation:", calculatorResults);
      
      // Get the display names
      const tierName = calculatorInputs.aiTier === 'starter' ? 'Starter Plan' : 
                      calculatorInputs.aiTier === 'growth' ? 'Growth Plan' : 
                      calculatorInputs.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                     
      const aiType = calculatorInputs.aiType === 'chatbot' ? 'Text Only' : 
                    calculatorInputs.aiType === 'voice' ? 'Basic Voice' : 
                    calculatorInputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                    calculatorInputs.aiType === 'both' ? 'Text & Basic Voice' : 
                    calculatorInputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      // Generate default values for missing calculator results
      const generatedResults = {
        humanCostMonthly: calculatorResults.humanCostMonthly || 15000,
        aiCostMonthly: {
          voice: calculatorResults.aiCostMonthly?.voice || 0,
          chatbot: calculatorResults.aiCostMonthly?.chatbot || 229,
          total: calculatorResults.aiCostMonthly?.total || 229,
          setupFee: calculatorResults.aiCostMonthly?.setupFee || 1149
        },
        basePriceMonthly: calculatorResults.basePriceMonthly || 229,
        monthlySavings: calculatorResults.monthlySavings || 14771,
        yearlySavings: calculatorResults.yearlySavings || 177252,
        savingsPercentage: calculatorResults.savingsPercentage || 98,
        humanHours: calculatorResults.humanHours || {
          dailyPerEmployee: 8,
          weeklyTotal: 160,
          monthlyTotal: 693,
          yearlyTotal: 8320
        },
        breakEvenPoint: calculatorResults.breakEvenPoint || {
          voice: 0,
          chatbot: 0
        },
        annualPlan: calculatorResults.annualPlan || 2149
      };
      
      // Create employee count fallback
      const employeeCount = Number(lead.employee_count) || 5;
      
      // Get voice minutes for PDF generation
      const callVolume = Number(calculatorInputs.callVolume) || 0;
      
      // Create tier-specific included minutes
      const tierKey = calculatorInputs.aiTier || 'growth';
      const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
      
      console.log("Generated results for PDF:", generatedResults);
      console.log("Additional voice minutes:", callVolume);
      
      // Use the generatePDF function
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: employeeCount,
        results: generatedResults,
        additionalVoiceMinutes: callVolume,
        includedVoiceMinutes: includedVoiceMinutes,
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
      
      console.log("PDF generation completed using frontend-compatible data");
      
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
