
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { saveProposalPDF } from "./proposal-generator/saveProposal";

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
      console.log('Generating proposal for lead:', lead);
      
      // Check if lead exists
      if (!lead) {
        throw new Error("Lead data is missing");
      }
      
      // Extract calculator results and inputs directly from lead data
      // with minimal transformations to preserve original values
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      console.log("Calculator results for proposal:", calculatorResults);
      console.log("Calculator inputs for proposal:", calculatorInputs);
      
      // Generate proposal using the same function as frontend
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: lead.employee_count || 5,
        results: calculatorResults,
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
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0
      });
      
      console.log("Proposal generation completed successfully");
      
      // Save the PDF
      saveProposalPDF(doc, lead);
      
      // Mark as downloaded
      markAsDownloaded();
      
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
    hasDownloaded,
    generateProposalDocument
  };
};
