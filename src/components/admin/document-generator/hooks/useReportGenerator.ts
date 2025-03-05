
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
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      console.log("Calculator results for report:", calculatorResults);
      console.log("Calculator inputs for report:", calculatorInputs);
      
      // Ensure all required properties have values (not just defined with undefined values)
      const safeResults = {
        humanCostMonthly: Number(calculatorResults.humanCostMonthly) || 0,
        monthlySavings: Number(calculatorResults.monthlySavings) || 0,
        yearlySavings: Number(calculatorResults.yearlySavings) || 0,
        savingsPercentage: Number(calculatorResults.savingsPercentage) || 0,
        aiCostMonthly: {
          voice: Number(calculatorResults.aiCostMonthly?.voice) || 0,
          chatbot: Number(calculatorResults.aiCostMonthly?.chatbot) || 0,
          total: Number(calculatorResults.aiCostMonthly?.total) || 0,
          setupFee: Number(calculatorResults.aiCostMonthly?.setupFee) || 0
        },
        breakEvenPoint: {
          voice: Number(calculatorResults.breakEvenPoint?.voice) || 0,
          chatbot: Number(calculatorResults.breakEvenPoint?.chatbot) || 0
        },
        humanHours: {
          dailyPerEmployee: Number(calculatorResults.humanHours?.dailyPerEmployee) || 8,
          weeklyTotal: Number(calculatorResults.humanHours?.weeklyTotal) || 40,
          monthlyTotal: Number(calculatorResults.humanHours?.monthlyTotal) || 160,
          yearlyTotal: Number(calculatorResults.humanHours?.yearlyTotal) || 2080
        },
        annualPlan: Number(calculatorResults.annualPlan) || 0,
        basePriceMonthly: Number(calculatorResults.basePriceMonthly) || 0
      };
      
      console.log("Using sanitized calculator results structure:", safeResults);
      
      // Get additional voice minutes directly from inputs
      const additionalVoiceMinutes = Number(calculatorInputs?.callVolume) || 0;
      
      // Generate PDF using the sanitized results structure
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
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
