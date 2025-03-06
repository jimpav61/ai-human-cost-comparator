
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
      
      // Get call volume (additional voice minutes) directly from calculator inputs
      const aiTier = calculatorInputs?.aiTier || 'growth';
      
      // IMPORTANT: Extract the call volume and make sure it's a number
      const callVolume = calculatorInputs?.callVolume ? 
        parseInt(String(calculatorInputs.callVolume), 10) : 0;
      
      // Additional voice minutes is exactly equal to the call volume input value
      const additionalVoiceMinutes = callVolume;
      
      // Determine the included minutes based on the tier
      const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
      
      console.log("Additional voice minutes for proposal:", additionalVoiceMinutes);
      console.log("Included voice minutes for tier:", includedVoiceMinutes);
      
      // Prepare safe base price from tier - using exact fixed prices
      const basePriceMonthly = 
        aiTier === 'starter' ? 99 : 
        aiTier === 'growth' ? 229 : 
        aiTier === 'premium' ? 429 : 229;
      
      // Calculate additional voice cost - now correctly using only minutes beyond the included amount
      const additionalVoiceCost = additionalVoiceMinutes > 0 ?
        Math.max(0, additionalVoiceMinutes - includedVoiceMinutes) * 0.12 : 0;
      
      const totalMonthlyCost = basePriceMonthly + additionalVoiceCost;
      
      console.log("Voice cost calculation:", {
        additionalVoiceMinutes,
        includedVoiceMinutes,
        chargeable: Math.max(0, additionalVoiceMinutes - includedVoiceMinutes),
        additionalVoiceCost,
        basePriceMonthly,
        totalMonthlyCost
      });
      
      // Ensure we have a valid structure for calculatorResults
      if (!calculatorResults.aiCostMonthly) {
        calculatorResults.aiCostMonthly = {
          voice: additionalVoiceCost,
          chatbot: basePriceMonthly,
          total: totalMonthlyCost,
          setupFee: aiTier === 'starter' ? 499 : aiTier === 'growth' ? 749 : 999
        };
      } else {
        // Update voice cost calculation to ensure it's accurate
        calculatorResults.aiCostMonthly.voice = additionalVoiceCost;
        calculatorResults.aiCostMonthly.chatbot = basePriceMonthly;
        calculatorResults.aiCostMonthly.total = totalMonthlyCost;
      }
      
      if (!calculatorResults.basePriceMonthly) {
        calculatorResults.basePriceMonthly = basePriceMonthly;
      }
      
      // Set fallback values for any missing properties
      const humanCostMonthly = calculatorResults.humanCostMonthly || 15000;
      const aiTotalCost = calculatorResults.aiCostMonthly.total;
      const monthlySavings = calculatorResults.monthlySavings || (humanCostMonthly - aiTotalCost);
      const yearlySavings = calculatorResults.yearlySavings || (monthlySavings * 12);
      const savingsPercentage = calculatorResults.savingsPercentage || Math.round((monthlySavings / humanCostMonthly) * 100);
      
      // Ensure required properties exist with sensible defaults
      const safeResults = {
        ...calculatorResults,
        aiCostMonthly: {
          voice: additionalVoiceCost,
          chatbot: basePriceMonthly,
          total: totalMonthlyCost,
          setupFee: aiTier === 'starter' ? 499 : aiTier === 'growth' ? 749 : 999
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
        humanCostMonthly: humanCostMonthly,
        monthlySavings: monthlySavings,
        yearlySavings: yearlySavings,
        savingsPercentage: savingsPercentage,
        // Add these properties to ensure they're available in the proposal generation
        includedVoiceMinutes: includedVoiceMinutes
      };
      
      console.log("Safe results with additional voice cost:", safeResults.aiCostMonthly);
      console.log("Additional voice minutes being passed to generateProposal:", additionalVoiceMinutes);
      
      // Generate proposal using the same function as frontend
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: lead.employee_count || 5,
        results: safeResults,
        additionalVoiceMinutes: additionalVoiceMinutes, // Explicitly pass the additionalVoiceMinutes
        includedVoiceMinutes: includedVoiceMinutes, // Explicitly pass the includedVoiceMinutes
        tierName: calculatorInputs?.aiTier ? 
          (calculatorInputs.aiTier === 'starter' ? 'Starter Plan' : 
          calculatorInputs.aiTier === 'growth' ? 'Growth Plan' : 
          'Premium Plan') : 'Growth Plan',
        aiType: calculatorInputs?.aiType ? 
          (calculatorInputs.aiType === 'chatbot' ? 'Text Only' : 
          calculatorInputs.aiType === 'voice' ? 'Basic Voice' : 
          calculatorInputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
          calculatorInputs.aiType === 'both' ? 'Text & Basic Voice' : 
          calculatorInputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only') : 'Text Only'
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
