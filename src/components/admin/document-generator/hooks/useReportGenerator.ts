
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
      console.log('[ADMIN] Generating report for lead:', lead);
      
      // Check if lead exists
      if (!lead) {
        throw new Error("Lead data is missing");
      }

      // Extract calculator inputs and results with proper typing
      const calculatorInputs = lead.calculator_inputs || {};
      const calculatorResults = lead.calculator_results || {};
      
      console.log('[ADMIN] Extracted calculator data:', {
        inputs: calculatorInputs,
        results: calculatorResults
      });
      
      // Calculate additional voice minutes for proper reporting
      const aiTier = calculatorInputs.aiTier || 'growth';
      const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
      const callVolume = Number(calculatorInputs.callVolume) || 0;
      const additionalVoiceMinutes = Math.max(0, callVolume - includedVoiceMinutes);
      
      console.log('[ADMIN] Voice calculation:', {
        aiTier,
        includedVoiceMinutes,
        callVolume,
        additionalVoiceMinutes
      });
      
      // Determine correct AI type display
      const aiTypeKey = calculatorInputs.aiType || 'chatbot';
      const aiTypeDisplay = 
        aiTypeKey === 'chatbot' ? 'Text Only' : 
        aiTypeKey === 'voice' ? 'Basic Voice' : 
        aiTypeKey === 'conversationalVoice' ? 'Conversational Voice' : 
        aiTypeKey === 'both' ? 'Text & Basic Voice' : 
        aiTypeKey === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      // Determine tier name
      const tierName = 
        aiTier === 'starter' ? 'Starter Plan' : 
        aiTier === 'growth' ? 'Growth Plan' : 
        aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
      
      console.log('[ADMIN] Starting PDF generation with shared utility using:', {
        tierName,
        aiTypeDisplay,
        additionalVoiceMinutes
      });
      
      // Generate PDF directly using the shared utility with properly transformed data
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
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
        aiType: aiTypeDisplay
      });
      
      console.log('[ADMIN] PDF generated successfully, saving document');
      
      // Save the PDF using the utility function
      saveReportPDF(doc, lead);
      
      console.log('[ADMIN] PDF saved and downloaded');
      
      // Mark as downloaded
      markAsDownloaded();
      
      toast({
        title: "Success",
        description: `Report for ${lead.company_name || 'Client'} generated and downloaded successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error('[ADMIN] Report generation error:', error);
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
