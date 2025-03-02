
import { Lead } from "@/types/leads";
import { FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateProposal } from "@/components/calculator/proposalGenerator";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";

interface ProposalGeneratorProps {
  lead: Lead;
}

export const ProposalGenerator = ({ lead }: ProposalGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedProposals',
    leadId: lead.id
  });

  const handleGenerateProposal = async () => {
    try {
      console.log('Generating proposal for lead:', lead);
      
      // Use the calculator inputs from lead or fallback to defaults
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
      
      // Ensure we use the correct tier from the inputs
      const tierToUse = inputs.aiTier || 'starter';
      const aiTypeToUse = inputs.aiType || 'chatbot';
      
      // Get setup fee from rates using the correct tier
      const setupFee = AI_RATES.chatbot[tierToUse].setupFee;
      
      // Use the calculator results from lead or create a complete default object
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
      
      // Calculate pricing details based on the inputs
      const pricingDetails = calculatePricingDetails(inputs);
      
      // Get display names based on tier and aiType
      const tierName = getTierDisplayName(tierToUse);
      const aiType = getAITypeDisplay(aiTypeToUse);
      
      console.log("Before generating proposal document with:", {
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
        // Generate the proposal document using the imported function
        const doc = generateProposal({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number || '',
          industry: lead.industry || 'Other',
          employeeCount: lead.employee_count || 5,
          results: results,
          tierName: tierName,
          aiType: aiType,
          pricingDetails: pricingDetails
        });
        
        // Make sure we have a valid company name for the file
        const safeCompanyName = lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
        
        console.log("Document generated, saving as:", `${safeCompanyName}-Proposal.pdf`);
        
        // Save the document with proper company name
        doc.save(`${safeCompanyName}-Proposal.pdf`);
        
        // Mark as downloaded
        markAsDownloaded();

        toast({
          title: "Success",
          description: "Proposal generated and downloaded successfully",
        });
      } catch (error) {
        console.error("Error in document generation step:", error);
        toast({
          title: "Error",
          description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="Proposal"
      downloadedLabel="Sent"
      icon={<FileDown className="h-4 w-4 mr-1" />}
      onClick={handleGenerateProposal}
    />
  );
};
