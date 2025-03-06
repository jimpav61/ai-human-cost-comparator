
import { generatePDF } from "@/components/calculator/pdf";
import { Lead } from "@/types/leads";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";
import { toast } from "@/hooks/use-toast";
import { JsPDFWithAutoTable } from "@/components/calculator/pdf/types";

/**
 * Shared utility function that generates and downloads a PDF report
 * for a lead using the same generator regardless of whether it's called
 * from the frontend or admin panel
 */
export const generateAndDownloadReport = (lead: Lead) => {
  try {
    console.log('[SHARED REPORT] Generating report for lead:', lead);
    
    // Check if lead exists and has calculator results
    if (!lead) {
      throw new Error("Lead data is missing");
    }

    console.log('[SHARED REPORT] Starting PDF generation with calculator data');
    
    // Calculate additional voice minutes directly from the calculator inputs
    const aiTier = lead.calculator_inputs?.aiTier || 'growth';
    
    // IMPORTANT: For admin reports, we need to explicitly extract the callVolume 
    // from calculator_inputs to ensure voice minutes are correctly included
    const additionalVoiceMinutes = lead.calculator_inputs?.callVolume ? 
      parseInt(String(lead.calculator_inputs.callVolume), 10) : 0;
    
    const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
    
    console.log('[SHARED REPORT] Additional voice minutes:', additionalVoiceMinutes);
    
    // Prepare safe base price from tier - using exact fixed prices
    const basePriceMonthly = 
      aiTier === 'starter' ? 99 : 
      aiTier === 'growth' ? 229 : 
      aiTier === 'premium' ? 429 : 229;
    
    // Calculate additional voice cost - always $0.12 per minute
    const additionalVoiceCost = Math.max(0, additionalVoiceMinutes - includedVoiceMinutes) * 0.12;
    const totalMonthlyCost = basePriceMonthly + additionalVoiceCost;
    
    // Ensure calculator_results has basic structure with safe defaults
    const calculatorResults = lead.calculator_results || {};
    
    // Properly populate aiCostMonthly if it's missing or incomplete
    if (!calculatorResults.aiCostMonthly) {
      calculatorResults.aiCostMonthly = {
        voice: additionalVoiceCost,
        chatbot: basePriceMonthly,
        total: totalMonthlyCost,
        setupFee: aiTier === 'starter' ? 249 : aiTier === 'growth' ? 749 : 1149
      };
    } else {
      // Ensure all properties exist in aiCostMonthly with correct values
      calculatorResults.aiCostMonthly.voice = additionalVoiceCost;
      calculatorResults.aiCostMonthly.chatbot = basePriceMonthly;
      calculatorResults.aiCostMonthly.total = totalMonthlyCost;
      calculatorResults.aiCostMonthly.setupFee = calculatorResults.aiCostMonthly.setupFee ?? 
        (aiTier === 'starter' ? 249 : aiTier === 'growth' ? 749 : 1149);
    }
    
    // Make sure we have a valid base price
    if (!calculatorResults.basePriceMonthly) {
      calculatorResults.basePriceMonthly = basePriceMonthly;
    } else {
      calculatorResults.basePriceMonthly = basePriceMonthly; // Override to ensure consistency
    }
    
    // Set reasonable defaults for the rest of the calculation results
    const humanCostMonthly = calculatorResults.humanCostMonthly ?? 15000;
    calculatorResults.monthlySavings = calculatorResults.monthlySavings ?? (humanCostMonthly - totalMonthlyCost);
    calculatorResults.yearlySavings = calculatorResults.yearlySavings ?? (calculatorResults.monthlySavings * 12);
    calculatorResults.savingsPercentage = calculatorResults.savingsPercentage ?? 
      ((humanCostMonthly - totalMonthlyCost) / humanCostMonthly * 100);
    
    console.log('[SHARED REPORT] Prepared calculator results with additionalVoiceMinutes:', additionalVoiceMinutes);
    console.log('[SHARED REPORT] aiCostMonthly:', calculatorResults.aiCostMonthly);
    
    // Generate the PDF using the shared generator
    const doc = generatePDF({
      contactInfo: lead.name || 'Valued Client',
      companyName: lead.company_name || 'Your Company',
      email: lead.email || 'client@example.com',
      phoneNumber: lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: calculatorResults,
      additionalVoiceMinutes: additionalVoiceMinutes, // Explicitly pass the additionalVoiceMinutes
      includedVoiceMinutes: includedVoiceMinutes,
      businessSuggestions: [
        {
          title: "Automate Common Customer Inquiries",
          description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
        },
        {
          title: "Enhance After-Hours Support",
          description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
        },
        {
          title: "Streamline Onboarding Process",
          description: "Use AI assistants to guide new customers through product setup and initial questions."
        }
      ],
      aiPlacements: [
        {
          role: "Front-line Customer Support",
          capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
        },
        {
          role: "Technical Troubleshooting",
          capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
        },
        {
          role: "Sales Assistant",
          capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
        }
      ],
      tierName: lead.calculator_inputs?.aiTier === 'starter' ? 'Starter Plan' : 
              lead.calculator_inputs?.aiTier === 'growth' ? 'Growth Plan' : 
              lead.calculator_inputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
      aiType: lead.calculator_inputs?.aiType === 'chatbot' ? 'Text Only' : 
              lead.calculator_inputs?.aiType === 'voice' ? 'Basic Voice' : 
              lead.calculator_inputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
              lead.calculator_inputs?.aiType === 'both' ? 'Text & Basic Voice' : 
              lead.calculator_inputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
    });
    
    // Save file with proper naming
    const safeCompanyName = getSafeFileName(lead);
    doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: `Report for ${lead.company_name || 'Client'} downloaded successfully`,
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error('[SHARED REPORT] Report generation error:', error);
    toast({
      title: "Error",
      description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return false;
  }
};
