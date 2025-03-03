
import { Lead } from "@/types/leads";
import { FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateProposal } from "@/components/calculator/proposalGenerator";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { useNavigate } from "react-router-dom";
import { AI_RATES } from "@/constants/pricing";
import type { CalculatorInputs } from "@/hooks/useCalculator";

interface ProposalGeneratorProps {
  lead: Lead;
}

export const ProposalGenerator = ({ lead }: ProposalGeneratorProps) => {
  const navigate = useNavigate();
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedProposals',
    leadId: lead.id
  });

  const handleGenerateProposal = async () => {
    try {
      console.log('Generating proposal for lead:', lead);
      
      // Use the actual inputs from lead data
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
      
      // Get the correct tier to use from the lead inputs
      const tierToUse = inputs.aiTier || 'growth';
      
      // Get the correct setup fee directly from AI_RATES
      const setupFee = AI_RATES.chatbot[tierToUse].setupFee;
      
      // Use the actual results from lead data if available
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
      
      // Calculate pricing details based on the actual inputs
      const pricingDetails = calculatePricingDetails(inputs);
      
      // Get tier and AI type display names based on the actual inputs
      const tierName = getTierDisplayName(inputs.aiTier);
      const aiType = getAITypeDisplay(inputs.aiType);
      
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
      
      doc.save(`${lead.company_name}-Proposal.pdf`);
      
      // Mark as downloaded
      markAsDownloaded();

      toast({
        title: "Success",
        description: "Proposal generated and downloaded successfully",
      });
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
