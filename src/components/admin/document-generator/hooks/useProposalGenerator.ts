
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { saveProposalPDF } from "./proposal-generator/saveProposal";
import { getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";

interface UseProposalGeneratorProps {
  lead: Lead;
}

export const useProposalGenerator = ({ lead }: UseProposalGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedProposals',
    leadId: lead.id
  });

  const generateProposalDocument = async () => {
    try {
      console.log("Generating proposal for lead:", lead);
      
      // Make sure we have calculator results
      if (!lead.calculator_results) {
        throw new Error("Calculator results missing from lead data");
      }
      
      // Get display names using the same frontend functions
      const tierName = getTierDisplayName(lead.calculator_inputs?.aiTier || 'starter');
      const aiType = getAITypeDisplay(lead.calculator_inputs?.aiType || 'chatbot');
      
      console.log("Using existing calculator results:", {
        results: lead.calculator_results,
        tierName,
        aiType
      });
      
      // Calculate additional voice minutes if any
      const additionalVoiceMinutes = lead.calculator_inputs?.callVolume || 0;
      
      // Generate the proposal using the same frontend function
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: lead.employee_count || 5,
        // Use exact results from the frontend
        results: lead.calculator_results,
        tierName,
        aiType,
        // Pass additional voice minutes explicitly
        additionalVoiceMinutes: additionalVoiceMinutes
      });
      
      // Save the PDF
      saveProposalPDF(doc, lead);
      
      // Mark as downloaded after successful generation
      markAsDownloaded();
      
      toast({
        title: "Success",
        description: "Proposal generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return {
    generateProposalDocument,
    hasDownloaded
  };
};
