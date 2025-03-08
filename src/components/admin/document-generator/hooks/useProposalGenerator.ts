
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
      const calculatorResults = lead.calculator_results || {};
      const calculatorInputs = lead.calculator_inputs || {};
      
      console.log("Calculator results for proposal:", calculatorResults);
      console.log("Calculator inputs for proposal:", calculatorInputs);
      
      // DIRECTLY extract plan tier from calculator inputs - don't use defaults
      const aiTier = calculatorInputs.aiTier || 'growth';
      console.log("Direct aiTier extraction:", aiTier);
      
      // DIRECTLY extract the call volume (additional voice minutes)
      // Use the exact value from calculator_inputs.callVolume
      let callVolume = calculatorInputs.callVolume;
      console.log("Raw callVolume directly from inputs:", callVolume, "type:", typeof callVolume);
      
      // Parse to ensure it's a valid number
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
      
      // Get AI type and ensure it's consistent with the tier
      let aiTypeValue = calculatorInputs.aiType || 'chatbot';
      
      // Force consistent AI type values based on tier
      if (aiTier === 'starter' && aiTypeValue !== 'chatbot') {
        aiTypeValue = 'chatbot';
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
      
      // Get the AI type display value
      const aiTypeDisplay = aiTypeValue === 'chatbot' ? 'Text Only' : 
        aiTypeValue === 'voice' ? 'Basic Voice' : 
        aiTypeValue === 'conversationalVoice' ? 'Conversational Voice' : 
        aiTypeValue === 'both' ? 'Text & Basic Voice' : 
        aiTypeValue === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      console.log("AI Type for proposal:", aiTypeValue);
      console.log("AI Type Display for proposal:", aiTypeDisplay);
      
      // Create safe calculations results with voice cost included
      const safeResults = {
        ...calculatorResults,
        aiCostMonthly: {
          voice: additionalVoiceCost,
          chatbot: basePriceMonthly,
          total: totalMonthlyCost,
          setupFee: calculatorResults.aiCostMonthly?.setupFee || 
            (aiTier === 'starter' ? 499 : aiTier === 'growth' ? 749 : 999)
        },
        breakEvenPoint: calculatorResults.breakEvenPoint || { 
          voice: 0, 
          chatbot: 0 
        },
        humanHours: calculatorResults.humanHours || {
          dailyPerEmployee: 8,
          weeklyTotal: Number(lead.employee_count) * 40 || 40,
          monthlyTotal: Number(lead.employee_count) * 160 || 160,
          yearlyTotal: Number(lead.employee_count) * 2080 || 2080
        },
        annualPlan: calculatorResults.annualPlan || (basePriceMonthly * 10),
        basePriceMonthly: basePriceMonthly,
        humanCostMonthly: calculatorResults.humanCostMonthly || 15000,
        monthlySavings: calculatorResults.monthlySavings || 0,
        yearlySavings: calculatorResults.yearlySavings || 0,
        savingsPercentage: calculatorResults.savingsPercentage || 0,
        tierKey: aiTier,
        aiType: aiTypeValue,
        includedVoiceMinutes: includedVoiceMinutes
      };
      
      console.log("Final results being passed to generateProposal:", safeResults);
      console.log("Additional voice minutes being passed to generateProposal:", additionalVoiceMinutes);
      
      // Generate proposal with all the extracted values
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: safeResults,
        additionalVoiceMinutes: additionalVoiceMinutes, // Explicitly pass the additionalVoiceMinutes
        includedVoiceMinutes: includedVoiceMinutes, // Explicitly pass the includedVoiceMinutes
        tierName: tierName, // Explicitly pass the tierName
        aiType: aiTypeDisplay // Explicitly pass the aiType display value
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
