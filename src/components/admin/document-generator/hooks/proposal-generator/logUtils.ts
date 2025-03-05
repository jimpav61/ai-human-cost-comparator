
import { Lead } from "@/types/leads";
import { AI_RATES } from "@/constants/pricing";

export const logProposalGeneration = (lead: Lead): void => {
  console.log('Generating proposal for lead:', lead);
  
  // Debug the tier and voice details for verification
  const tierToUse = lead.calculator_inputs?.aiTier || 'starter';
  const callVolume = lead.calculator_inputs?.callVolume || 0;
  const avgCallDuration = lead.calculator_inputs?.avgCallDuration || 0;
  const totalMinutes = callVolume * avgCallDuration;
  const includedMinutes = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.includedVoiceMinutes || 0;
  
  console.log('PROPOSAL GENERATION - VOICE CALCULATION:', {
    leadId: lead.id,
    tierToUse,
    callVolume,
    avgCallDuration,
    totalMinutes,
    includedMinutes,
    exceedsIncluded: totalMinutes > includedMinutes,
    extraMinutes: Math.max(0, totalMinutes - includedMinutes)
  });
};
