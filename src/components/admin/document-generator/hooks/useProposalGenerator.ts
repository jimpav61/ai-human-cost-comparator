
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { useDownloadState } from "./useDownloadState";

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
      
      // If we have calculator_results directly from the lead, use those
      if (lead.calculator_results && typeof lead.calculator_results === 'object') {
        return await generateFromExistingResults();
      }
      
      // Fallback logic if we don't have calculator_results
      return await generateFromInputs();
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  const generateFromExistingResults = async () => {
    try {
      const tierToUse = lead.calculator_inputs?.aiTier || 'starter';
      const aiTypeToUse = lead.calculator_inputs?.aiType || 'chatbot';
      
      // Get display names based on tier and aiType
      const tierName = getTierDisplayName(tierToUse);
      const aiType = getAITypeDisplay(aiTypeToUse);
      
      // Calculate pricing details based on the inputs
      const pricingDetails = calculatePricingDetails(lead.calculator_inputs || {
        aiType: aiTypeToUse,
        aiTier: tierToUse,
        role: 'customerService',
        numEmployees: lead.employee_count || 5,
        callVolume: 0,
        avgCallDuration: 4.5,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      });
      
      console.log("Using lead's existing calculator results:", lead.calculator_results);
      
      // Ensure we have valid values in the results
      const validatedResults = { ...lead.calculator_results };
      
      // Make sure aiCostMonthly structure exists
      if (!validatedResults.aiCostMonthly) {
        validatedResults.aiCostMonthly = {
          voice: 0,
          chatbot: AI_RATES.chatbot[tierToUse].base,
          total: AI_RATES.chatbot[tierToUse].base,
          setupFee: AI_RATES.chatbot[tierToUse].setupFee
        };
      } else {
        // Ensure total is not 0
        if (!validatedResults.aiCostMonthly.total || validatedResults.aiCostMonthly.total === 0) {
          validatedResults.aiCostMonthly.total = AI_RATES.chatbot[tierToUse].base;
        }
        
        // Ensure chatbot cost is not 0
        if (!validatedResults.aiCostMonthly.chatbot || validatedResults.aiCostMonthly.chatbot === 0) {
          validatedResults.aiCostMonthly.chatbot = AI_RATES.chatbot[tierToUse].base;
        }
        
        // Ensure setup fee is not 0
        if (!validatedResults.aiCostMonthly.setupFee || validatedResults.aiCostMonthly.setupFee === 0) {
          validatedResults.aiCostMonthly.setupFee = AI_RATES.chatbot[tierToUse].setupFee;
        }
      }
      
      // Add the tier key to be used in recommendedSolution
      validatedResults.tierKey = tierToUse;
      
      try {
        // Generate the proposal document using the imported function with the validated results
        const doc = generateProposal({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number || '',
          industry: lead.industry || 'Other',
          employeeCount: lead.employee_count || 5,
          results: validatedResults,
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
        toast({
          title: "Error",
          description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error("Error generating from existing results:", error);
      throw error;
    }
  };
  
  const generateFromInputs = async () => {
    try {
      console.log("No calculator results found, calculating values");
      
      // Use the calculator inputs from lead or fallback to defaults
      const inputs = lead.calculator_inputs || {
        aiType: 'chatbot',
        aiTier: 'starter',
        role: 'customerService',
        numEmployees: lead.employee_count || 5,
        callVolume: 0, 
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
      
      // Ensure we use the correct tier from the inputs
      const tierToUse = inputs.aiTier || 'starter';
      const aiTypeToUse = inputs.aiType || 'chatbot';
      
      // Get pricing details from AI_RATES
      const setupFee = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.setupFee || 0;
      const annualPrice = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.annualPrice || 0;
      const baseMonthlyPrice = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.base || 0;
      const includedVoiceMinutes = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.includedVoiceMinutes || 0;
      
      // Calculate pricing details based on the inputs
      const pricingDetails = calculatePricingDetails(inputs);
      
      // Calculate the total monthly cost (base + usage)
      let totalMonthlyAICost = baseMonthlyPrice;
      
      // Calculate voice costs if applicable
      let voiceCost = 0;
      if (aiTypeToUse === 'voice' || aiTypeToUse === 'conversationalVoice' || 
          aiTypeToUse === 'both' || aiTypeToUse === 'both-premium') {
          
        // Calculate total minutes used
        const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
        
        // Only charge for minutes above the included amount
        const chargeableMinutes = Math.max(0, totalMinutes - includedVoiceMinutes);
        
        // Get the per-minute rate for this tier
        const voiceRate = AI_RATES.voice[tierToUse as keyof typeof AI_RATES.voice] || 0;
        
        // Apply conversational factor for premium/conversational voice
        const isConversational = aiTypeToUse === 'conversationalVoice' || aiTypeToUse === 'both-premium';
        const conversationalFactor = (tierToUse === 'premium' || isConversational) ? 1.15 : 1.0;
        
        // Calculate voice cost
        voiceCost = chargeableMinutes * voiceRate * conversationalFactor;
        totalMonthlyAICost += voiceCost;
      }
      
      // Calculate human cost based on role and employees
      const humanCostMonthly = 3800; // Default human cost if not calculated
      
      // Calculate savings
      const monthlySavings = humanCostMonthly - totalMonthlyAICost;
      const yearlySavings = monthlySavings * 12;
      const savingsPercentage = humanCostMonthly > 0 ? (monthlySavings / humanCostMonthly) * 100 : 0;
      
      // Create complete results object
      const results = {
        aiCostMonthly: { 
          voice: voiceCost, 
          chatbot: baseMonthlyPrice, 
          total: Math.max(totalMonthlyAICost, baseMonthlyPrice), // Ensure we never have 0 cost
          setupFee: setupFee
        },
        humanCostMonthly: humanCostMonthly,
        monthlySavings: monthlySavings,
        yearlySavings: yearlySavings,
        savingsPercentage: savingsPercentage,
        breakEvenPoint: { voice: 240, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        },
        annualPlan: annualPrice,
        tierKey: tierToUse // Add the tier key to be used in recommendedSolution
      };
      
      // Get display names based on tier and aiType
      const tierName = getTierDisplayName(tierToUse);
      const aiType = getAITypeDisplay(aiTypeToUse);
      
      console.log("Before generating proposal document with:", {
        contactInfo: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        tierName,
        aiType,
        tierToUse,
        aiTypeToUse,
        results
      });

      try {
        // Generate the proposal document using the imported function
        const doc = generateProposal({
          contactInfo: lead.name || 'Valued Client',
          companyName: lead.company_name || 'Your Company',
          email: lead.email || 'client@example.com',
          phoneNumber: lead.phone_number || '',
          industry: lead.industry || 'Other',
          employeeCount: lead.employee_count || 5,
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
        toast({
          title: "Error",
          description: `Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        throw error;
      }
    } catch (error) {
      console.error("Error generating from inputs:", error);
      throw error;
    }
  };

  return {
    generateProposalDocument,
    hasDownloaded
  };
};
