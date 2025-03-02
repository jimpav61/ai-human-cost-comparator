
import { Lead } from "@/types/leads";
import { FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateProposal } from "@/components/calculator/proposalGenerator";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { useNavigate } from "react-router-dom";

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
      
      // Create default values for missing data based on the tier
      const defaultInputs = {
        aiType: 'both',
        aiTier: 'growth',
        role: 'customerService',
        numEmployees: 5,
        callVolume: 1000, 
        avgCallDuration: 5,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
      
      // Use actual data if available, otherwise use defaults
      const inputs = lead.calculator_inputs || defaultInputs;
      
      // Default results based on the tier
      const defaultResults = {
        aiCostMonthly: { 
          voice: inputs.aiTier === 'starter' ? 0 : 55, 
          chatbot: inputs.aiTier === 'starter' ? 99 : (inputs.aiTier === 'growth' ? 229 : 429), 
          total: inputs.aiTier === 'starter' ? 99 : (inputs.aiTier === 'growth' ? 229 + 55 : 429 + 55), 
          setupFee: inputs.aiTier === 'starter' ? 249 : (inputs.aiTier === 'growth' ? 749 : 1149) 
        },
        humanCostMonthly: 3800,
        monthlySavings: 3516,
        yearlySavings: 42192,
        savingsPercentage: 92.5,
        breakEvenPoint: { voice: 240, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        },
        annualPlan: inputs.aiTier === 'starter' ? 990 : (inputs.aiTier === 'growth' ? 2290 : 4290)
      };
      
      // Use actual data if available, otherwise use defaults
      const results = lead.calculator_results && Object.keys(lead.calculator_results).length > 0 
        ? lead.calculator_results 
        : defaultResults;
      
      // Calculate pricing details
      const pricingDetails = calculatePricingDetails(inputs);
      
      // Get tier and AI type display names
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

      // Navigate back to admin dashboard
      navigate('/admin');

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
