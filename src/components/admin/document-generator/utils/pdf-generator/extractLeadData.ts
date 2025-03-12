
import { Lead } from "@/types/leads";
import { PdfContentParams } from "./types";

/**
 * Extracts and prepares all data needed for the PDF from the lead object
 * Using exact values from calculator_results without modification
 */
export function extractLeadData(lead: Lead): PdfContentParams {
  // Extract lead information
  const companyName = lead.company_name || 'Client';
  const contactName = lead.name || 'Client';
  const email = lead.email || 'client@example.com';
  const phoneNumber = lead.phone_number || 'Not provided';
  const industry = lead.industry || 'Technology';
  
  // CRITICAL: Use exact calculator results without any processing
  const calculatorResults = lead.calculator_results;
  
  // Extract AI tier and type directly from calculator inputs
  const aiTier = lead.calculator_inputs?.aiTier || 'growth';
  const aiType = lead.calculator_inputs?.aiType || 'both';
  
  // Get display names directly from saved values
  const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                  aiTier === 'growth' ? 'Growth Plan' : 'Premium Plan';
  
  const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                       aiType === 'voice' ? 'Basic Voice' : 
                       aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                       aiType === 'both' ? 'Text & Basic Voice' : 
                       aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  
  // Use exact values from calculator_results - no fallbacks or recalculations
  const basePrice = calculatorResults.basePriceMonthly;
  const totalPrice = calculatorResults.aiCostMonthly.total;
  const setupFee = calculatorResults.aiCostMonthly.setupFee;
  const humanCostMonthly = calculatorResults.humanCostMonthly;
  const monthlySavings = calculatorResults.monthlySavings;
  const yearlySavings = calculatorResults.yearlySavings;
  const savingsPercentage = calculatorResults.savingsPercentage;
  // Convert annualPlan to boolean - if it's 1 or any other truthy number, it becomes true
  const annualPlan = Boolean(calculatorResults.annualPlan);
  const voiceCost = calculatorResults.aiCostMonthly.voice;
  const includedMinutes = aiTier === 'starter' ? 0 : 600;
  const callVolume = lead.calculator_inputs?.callVolume || 0;

  // Generate current date for the proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;

  // Brand Colors
  const brandRed = "#ff432a";
  
  return {
    brandRed,
    companyName,
    contactName,
    email,
    phoneNumber,
    industry,
    aiTier,
    aiType,
    tierName,
    aiTypeDisplay,
    basePrice,
    includedMinutes,
    callVolume,
    voiceCost,
    totalPrice,
    setupFee,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    annualPlan,
    formattedDate
  };
}
