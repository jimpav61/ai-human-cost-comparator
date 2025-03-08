
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { useDownloadState } from "./useDownloadState";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { saveProposalPDF } from "./proposal-generator/saveProposal";

interface UseProposalGeneratorProps {
  lead: Lead;
}

export const useProposalGenerator = ({ lead }: UseProposalGeneratorProps) => {
  // Fix: Pass the correct property name 'id' instead of 'leadId' to match the interface
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedProposals',
    id: lead.id
  });

  const generateProposalDocument = async () => {
    try {
      console.log('Generating proposal for lead:', lead);
      
      // Check if lead exists
      if (!lead) {
        throw new Error("Lead data is missing");
      }
      
      // Extract calculator_inputs directly from lead data
      // Use spread to create a copy to avoid modifying the original
      const calculatorInputs = {...(lead.calculator_inputs || {})};
      
      console.log("Raw calculator inputs for proposal:", calculatorInputs);
      
      // Extract plan tier and force it to a valid value
      const aiTier = calculatorInputs.aiTier || 'growth';
      console.log("Direct aiTier extraction:", aiTier);
      
      // Extract and verify the AI type
      let aiTypeValue = calculatorInputs.aiType || 'chatbot';
      console.log("Direct aiType extraction:", aiTypeValue);
      
      // Force consistent AI type values based on tier
      if (aiTier === 'starter' && aiTypeValue !== 'chatbot') {
        aiTypeValue = 'chatbot';
        console.log("Forcing AI type to chatbot for starter plan");
      } else if (aiTier === 'premium') {
        if (aiTypeValue === 'voice') {
          aiTypeValue = 'conversationalVoice';
        } else if (aiTypeValue === 'both') {
          aiTypeValue = 'both-premium';
        }
      } else if (aiTier === 'growth') {
        if (aiTypeValue === 'conversationalVoice') {
          aiTypeValue = 'voice';
        } else if (aiTypeValue === 'both-premium') {
          aiTypeValue = 'both';
        }
      }
      
      console.log("Normalized aiType:", aiTypeValue);
      
      // CRUCIAL FIX: Properly extract the call volume (additional voice minutes)
      // And ensure it's parsed as a number no matter what format it's stored in
      let callVolume = calculatorInputs.callVolume;
      console.log("Raw callVolume directly from inputs:", callVolume, "type:", typeof callVolume);
      
      // Ensure callVolume is a number
      if (typeof callVolume === 'string') {
        callVolume = parseInt(callVolume, 10) || 0;
      } else if (typeof callVolume !== 'number') {
        callVolume = 0;
      }
      
      console.log("Parsed callVolume for proposal:", callVolume);
      
      // Additional voice minutes is the exact call volume input value
      const additionalVoiceMinutes = callVolume;
      
      // Determine the included minutes based on the tier
      const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
      
      console.log("Plan tier for proposal:", aiTier);
      console.log("Additional voice minutes for proposal:", additionalVoiceMinutes);
      console.log("Included voice minutes for tier:", includedVoiceMinutes);
      
      // Get exact tier name for display
      const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                      aiTier === 'growth' ? 'Growth Plan' : 
                      aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
      
      // Get exact base price from tier - using fixed pricing
      const basePriceMonthly = 
        aiTier === 'starter' ? 99 : 
        aiTier === 'growth' ? 229 : 
        aiTier === 'premium' ? 429 : 229;
      
      // Calculate additional voice cost
      const additionalVoiceCost = additionalVoiceMinutes * 0.12;
      const totalMonthlyCost = basePriceMonthly + additionalVoiceCost;
      
      console.log("Voice cost calculation:", {
        additionalVoiceMinutes,
        includedVoiceMinutes,
        additionalVoiceCost,
        basePriceMonthly,
        totalMonthlyCost
      });
      
      // Get the AI type display value
      const aiTypeDisplay = aiTypeValue === 'chatbot' ? 'Text Only' : 
        aiTypeValue === 'voice' ? 'Basic Voice' : 
        aiTypeValue === 'conversationalVoice' ? 'Conversational Voice' : 
        aiTypeValue === 'both' ? 'Text & Basic Voice' : 
        aiTypeValue === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      console.log("AI Type for proposal:", aiTypeValue);
      console.log("AI Type Display for proposal:", aiTypeDisplay);
      
      // Extract calculator results from lead - ensure it's an object
      // Use spread to create a copy to avoid modifying the original
      const calculatorResults = {...(lead.calculator_results || {})};
      
      // CRUCIAL FIX: Update the calculator results with the current calculations
      // to ensure the PDF generator has the correct values
      calculatorResults.aiCostMonthly = {
        voice: additionalVoiceCost,
        chatbot: basePriceMonthly,
        total: totalMonthlyCost,
        setupFee: calculatorResults.aiCostMonthly?.setupFee || 
          (aiTier === 'starter' ? 499 : aiTier === 'growth' ? 749 : 999)
      };
      
      calculatorResults.basePriceMonthly = basePriceMonthly;
      calculatorResults.tierKey = aiTier;
      calculatorResults.aiType = aiTypeValue;
      
      // Human cost monthly fallback
      const humanCostMonthly = calculatorResults.humanCostMonthly || 15000;
      
      // Recalculate savings with the current total cost
      calculatorResults.monthlySavings = humanCostMonthly - totalMonthlyCost;
      calculatorResults.yearlySavings = calculatorResults.monthlySavings * 12;
      calculatorResults.savingsPercentage = (calculatorResults.monthlySavings / humanCostMonthly) * 100;
      
      console.log("Final results being passed to generateProposal:", calculatorResults);
      console.log("Additional voice minutes being passed to generateProposal:", additionalVoiceMinutes);
      
      // Generate proposal with all the extracted values
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults,
        additionalVoiceMinutes: additionalVoiceMinutes, // Make sure this value is passed correctly
        includedVoiceMinutes: includedVoiceMinutes,
        tierName: tierName,
        aiType: aiTypeDisplay
      });
      
      console.log("Proposal generation completed successfully");
      
      // Save the PDF
      saveProposalPDF(doc, lead);
      
      // Mark as downloaded
      markAsDownloaded();
      
      toast({
        title: "Success",
        description: `Proposal for ${lead.company_name || 'Client'} generated successfully`,
        variant: "default",
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
    hasDownloaded,
    generateProposalDocument
  };
};
