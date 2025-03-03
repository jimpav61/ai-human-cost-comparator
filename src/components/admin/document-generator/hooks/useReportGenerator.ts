
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { generatePDF } from "@/components/calculator/pdfGenerator";

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
      
      // Use the calculator inputs from lead or fallback to defaults - preserving original aiTier and aiType
      const inputs = lead.calculator_inputs || {
        aiType: 'chatbot',
        aiTier: 'starter',
        role: 'customerService',
        numEmployees: lead.employee_count || 5,
        callVolume: 0, 
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
      
      // Get the tier from the lead's original inputs - not defaulting to growth
      const tierToUse = inputs.aiTier || 'starter';
      const aiTypeToUse = inputs.aiType || 'chatbot';
      
      // Setup fee from rates using the original tier
      const setupFee = AI_RATES.chatbot[tierToUse].setupFee;
      
      // Use the calculator results from lead or create a complete default object based on the ORIGINAL tier
      const results = lead.calculator_results || {
        aiCostMonthly: { 
          voice: aiTypeToUse === 'chatbot' ? 0 : 55, 
          chatbot: AI_RATES.chatbot[tierToUse].base, 
          total: aiTypeToUse === 'chatbot' ? AI_RATES.chatbot[tierToUse].base : 
                (AI_RATES.chatbot[tierToUse].base + 55), 
          setupFee: setupFee
        },
        humanCostMonthly: 3800,
        monthlySavings: 3800 - (aiTypeToUse === 'chatbot' ? AI_RATES.chatbot[tierToUse].base : 
                              (AI_RATES.chatbot[tierToUse].base + 55)),
        yearlySavings: (3800 - (aiTypeToUse === 'chatbot' ? AI_RATES.chatbot[tierToUse].base : 
                               (AI_RATES.chatbot[tierToUse].base + 55))) * 12,
        savingsPercentage: ((3800 - (aiTypeToUse === 'chatbot' ? AI_RATES.chatbot[tierToUse].base : 
                               (AI_RATES.chatbot[tierToUse].base + 55))) / 3800) * 100,
        breakEvenPoint: { voice: 240, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        },
        annualPlan: AI_RATES.chatbot[tierToUse].annualPrice
      };
      
      // Ensure all nested objects and properties exist to prevent undefined errors
      if (!results.aiCostMonthly) {
        results.aiCostMonthly = { 
          voice: 0, 
          chatbot: AI_RATES.chatbot[tierToUse].base, 
          total: AI_RATES.chatbot[tierToUse].base,
          setupFee: setupFee 
        };
      }
      
      if (!results.breakEvenPoint) {
        results.breakEvenPoint = { voice: 240, chatbot: 520 };
      }
      
      if (!results.humanHours) {
        results.humanHours = {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        };
      }
      
      // Get display names based on the ORIGINAL tier and aiType
      const tierName = getTierDisplayName(tierToUse);
      const aiType = getAITypeDisplay(aiTypeToUse);
      
      console.log("Before generating PDF report with:", {
        contactInfo: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        tierName,
        aiType,
        tierToUse,
        aiTypeToUse,
        results
      });
      
      try {
        // Generate and download the PDF using the imported function
        const doc = generatePDF({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number || '',
          industry: lead.industry || 'Other',
          employeeCount: lead.employee_count || 5,
          results: results,
          tierName: tierName,
          aiType: aiType,
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
          ]
        });
        
        // Make sure we have a valid company name for the file
        const safeCompanyName = lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
        
        console.log("Document generated, saving as:", `${safeCompanyName}-Report.pdf`);
        
        // Save the document with proper company name
        doc.save(`${safeCompanyName}-Report.pdf`);
        
        // Mark as downloaded
        markAsDownloaded();

        toast({
          title: "Success",
          description: "Report generated and downloaded successfully",
        });
      } catch (error) {
        console.error("Error in document generation step:", error);
        toast({
          title: "Error",
          description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
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
