
import { generatePDF } from "@/components/calculator/pdf";
import { Lead } from "@/types/leads";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalculationResults } from "@/hooks/calculator/types";
import { toJson, ensureCalculatorInputs } from "@/hooks/calculator/supabase-types";
import { performCalculations } from "@/hooks/calculator/calculations";

/**
 * Checks if a lead has calculator results and can generate a report
 */
const canGenerateReport = (lead: Lead): boolean => {
  return (
    lead && 
    lead.calculator_results && 
    typeof lead.calculator_results === 'object' &&
    Object.keys(lead.calculator_results).length > 0
  );
};

/**
 * Generate and save a new report from the calculator results
 * This is only used from the frontend calculator
 */
export const generateAndDownloadReport = async (lead: Lead) => {
  try {
    console.log('[CALCULATOR REPORT] Generating report for lead:', lead);
    console.log('[CALCULATOR REPORT] Lead ID:', lead.id);
    
    // Check if lead exists and has required data
    if (!lead || !lead.id) {
      throw new Error("Invalid lead data");
    }

    if (!canGenerateReport(lead)) {
      throw new Error("This lead has no calculator results. Please complete the calculator first.");
    }

    // Create a safely typed CalculationResults object from the lead data
    const rawCalculatorResults = lead.calculator_results as unknown as Record<string, any>;
    const calculatorInputs = lead.calculator_inputs as unknown as Record<string, any>;
    
    // Extract key data from the lead
    // CRITICAL FIX: Extract and ensure additionalVoiceMinutes is available and numeric
    let additionalVoiceMinutes = 0;
    
    // First try to get it from calculator_results
    if (rawCalculatorResults && 'additionalVoiceMinutes' in rawCalculatorResults) {
      additionalVoiceMinutes = Number(rawCalculatorResults.additionalVoiceMinutes) || 0;
      console.log("[CALCULATOR REPORT] Found additionalVoiceMinutes in results:", additionalVoiceMinutes);
    } 
    // Then try callVolume from calculator_inputs as a fallback
    else if (calculatorInputs && 'callVolume' in calculatorInputs) {
      additionalVoiceMinutes = Number(calculatorInputs.callVolume) || 0;
      console.log("[CALCULATOR REPORT] Using callVolume from inputs:", additionalVoiceMinutes);
    }
    
    // CRITICAL FIX: Ensure we use the correct tierKey and aiType
    let tierKey = rawCalculatorResults?.tierKey || calculatorInputs?.aiTier || 'growth';
    let aiType = rawCalculatorResults?.aiType || calculatorInputs?.aiType || 'chatbot';
    
    console.log("[CALCULATOR REPORT] Using tierKey:", tierKey);
    console.log("[CALCULATOR REPORT] Using aiType:", aiType);
    
    // CRITICAL: Ensure 1:1 replacement model by forcing numEmployees to 1
    if (calculatorInputs) {
      calculatorInputs.numEmployees = 1;
      
      try {
        const validInputs = ensureCalculatorInputs(calculatorInputs);
        const recalculatedResults = performCalculations(validInputs, {});
        console.log("[CALCULATOR REPORT] Recalculated results with 1:1 replacement model:", recalculatedResults);
        // Update raw results with recalculated values
        rawCalculatorResults.humanCostMonthly = recalculatedResults.humanCostMonthly;
        rawCalculatorResults.monthlySavings = recalculatedResults.monthlySavings;
        rawCalculatorResults.yearlySavings = recalculatedResults.yearlySavings;
        rawCalculatorResults.savingsPercentage = recalculatedResults.savingsPercentage;
      } catch (calcError) {
        console.error("[CALCULATOR REPORT] Error recalculating results:", calcError);
        // Continue with existing results if recalculation fails
      }
    }
    
    // Extract calculator data
    const calculatorResults: CalculationResults = {
      aiCostMonthly: {
        voice: Number(rawCalculatorResults?.aiCostMonthly?.voice) || 0,
        chatbot: Number(rawCalculatorResults?.aiCostMonthly?.chatbot) || 0,
        total: Number(rawCalculatorResults?.aiCostMonthly?.total) || 0,
        setupFee: Number(rawCalculatorResults?.aiCostMonthly?.setupFee) || 0
      },
      basePriceMonthly: Number(rawCalculatorResults?.basePriceMonthly) || 0,
      humanCostMonthly: Number(rawCalculatorResults?.humanCostMonthly) || 0,
      monthlySavings: Number(rawCalculatorResults?.monthlySavings) || 0,
      yearlySavings: Number(rawCalculatorResults?.yearlySavings) || 0,
      savingsPercentage: Number(rawCalculatorResults?.savingsPercentage) || 0,
      breakEvenPoint: {
        voice: Number(rawCalculatorResults?.breakEvenPoint?.voice) || 0,
        chatbot: Number(rawCalculatorResults?.breakEvenPoint?.chatbot) || 0
      },
      humanHours: {
        dailyPerEmployee: Number(rawCalculatorResults?.humanHours?.dailyPerEmployee) || 0,
        weeklyTotal: Number(rawCalculatorResults?.humanHours?.weeklyTotal) || 0,
        monthlyTotal: Number(rawCalculatorResults?.humanHours?.monthlyTotal) || 0,
        yearlyTotal: Number(rawCalculatorResults?.humanHours?.yearlyTotal) || 0
      },
      annualPlan: Number(rawCalculatorResults?.annualPlan) || 0,
      // CRITICAL FIX: Use the exact tier key and AI type from the lead data
      tierKey: tierKey as "starter" | "growth" | "premium",
      aiType: aiType,
      includedVoiceMinutes: Number(rawCalculatorResults?.includedVoiceMinutes) || (tierKey === 'starter' ? 0 : 600),
      additionalVoiceMinutes: additionalVoiceMinutes
    };
    
    // Format tier and AI type display names
    const tierName = tierKey === 'starter' ? 'Starter Plan' : 
                    tierKey === 'growth' ? 'Growth Plan' : 
                    tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan';
                    
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                          aiType === 'voice' ? 'Basic Voice' : 
                          aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                          aiType === 'both' ? 'Text & Basic Voice' : 
                          aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
    
    // Generate the PDF
    const doc = generatePDF({
      contactInfo: lead.name || 'Valued Client',
      companyName: lead.company_name || 'Your Company',
      email: lead.email || 'client@example.com',
      phoneNumber: lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: calculatorResults,
      additionalVoiceMinutes: additionalVoiceMinutes,
      includedVoiceMinutes: tierKey === 'starter' ? 0 : 600,
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
      tierName: tierName,
      aiType: aiTypeDisplay
    });
    
    // Generate a report ID that will be used when saving to database
    // Using crypto.randomUUID() to ensure a valid UUID format
    const reportId = crypto.randomUUID();
    
    // Only save if we have a valid report ID
    if (reportId) {
      // Update calculator_inputs to ensure numEmployees is 1
      if (calculatorInputs) {
        calculatorInputs.numEmployees = 1;
      }
      
      // Make sure additionalVoiceMinutes is in calculator_results before saving
      rawCalculatorResults.additionalVoiceMinutes = additionalVoiceMinutes;
      // Make sure tierKey and aiType are preserved exactly as used
      rawCalculatorResults.tierKey = tierKey;
      rawCalculatorResults.aiType = aiType;
      
      // Convert complex objects to JSON-compatible format
      const jsonInputs = toJson(calculatorInputs);
      const jsonResults = toJson(rawCalculatorResults);
      
      // Create the report data with the generated UUID
      const reportData = {
        id: reportId, 
        contact_name: lead.name,
        company_name: lead.company_name,
        email: lead.email,
        phone_number: lead.phone_number || null,
        calculator_inputs: jsonInputs,
        calculator_results: jsonResults,
        report_date: new Date().toISOString()
      };
      
      console.log('[CALCULATOR REPORT] Saving report to database with ID:', reportData.id);
      console.log('[CALCULATOR REPORT] Report data tierKey:', tierKey);
      console.log('[CALCULATOR REPORT] Report data aiType:', aiType);
      console.log('[CALCULATOR REPORT] Report data additionalVoiceMinutes:', additionalVoiceMinutes);
      
      try {
        const { error } = await supabase
          .from('generated_reports')
          .insert(reportData);
          
        if (error) {
          // If there's a foreign key violation error, just log it but continue
          if (error.code === '23503') {
            console.error('[CALCULATOR REPORT] Foreign key constraint error, skipping database save:', error);
          } else {
            console.error('[CALCULATOR REPORT] Error saving report to database:', error);
          }
        } else {
          console.log('[CALCULATOR REPORT] Report saved to database successfully with ID:', reportData.id);
        }
      } catch (dbError) {
        console.error('[CALCULATOR REPORT] Database operation error:', dbError);
      }
    } else {
      console.warn('[CALCULATOR REPORT] Cannot save report - failed to generate report ID');
    }
    
    // Save file with proper naming
    const safeCompanyName = getSafeFileName(lead);
    doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
    
    return true;
  } catch (error) {
    console.error('[CALCULATOR REPORT] Report generation error:', error);
    toast({
      title: "Error",
      description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return false;
  }
};
