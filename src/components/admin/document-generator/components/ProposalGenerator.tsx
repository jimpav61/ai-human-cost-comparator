
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
        aiTier: 'growth',
        role: 'customerService',
        numEmployees: lead.employee_count || 5,
        callVolume: 0, 
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
      
      // Get the tier to use from inputs
      const tierToUse = inputs.aiTier || 'growth';
      
      // Get setup fee from rates
      const setupFee = AI_RATES.chatbot[tierToUse].setupFee;
      
      // Use the calculator results from lead or fallback to calculated defaults
      const results = lead.calculator_results || {
        aiCostMonthly: { 
          voice: inputs.aiType === 'starter' ? 0 : 55, 
          chatbot: AI_RATES.chatbot[tierToUse].base, 
          total: inputs.aiType === 'starter' ? AI_RATES.chatbot[tierToUse].base : 
                (AI_RATES.chatbot[tierToUse].base + 55), 
          setupFee: setupFee
        },
        humanCostMonthly: 3800,
        monthlySavings: 3800 - (inputs.aiType === 'starter' ? AI_RATES.chatbot[tierToUse].base : 
                              (AI_RATES.chatbot[tierToUse].base + 55)),
        yearlySavings: (3800 - (inputs.aiType === 'starter' ? AI_RATES.chatbot[tierToUse].base : 
                               (AI_RATES.chatbot[tierToUse].base + 55))) * 12,
        savingsPercentage: ((3800 - (inputs.aiType === 'starter' ? AI_RATES.chatbot[tierToUse].base : 
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
      
      // Calculate pricing details based on inputs
      const pricingDetails = calculatePricingDetails(inputs);
      
      // Get display names
      const tierName = getTierDisplayName(inputs.aiTier);
      const aiType = getAITypeDisplay(inputs.aiType);
      
      console.log("Before generating proposal document with:", {
        contactInfo: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        tierName,
        aiType,
        results
      });

      try {
        // Generate the proposal document using the imported function
        const doc = generateProposal({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number,
          industry: lead.industry,
          employeeCount: lead.employee_count,
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
        throw error;
      }
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate proposal",
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
