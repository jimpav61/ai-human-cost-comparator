
import { generatePDF } from "@/components/calculator/pdf";
import { Lead } from "@/types/leads";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CalculationResults } from "@/hooks/calculator/types";

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
      annualPlan: Number(rawCalculatorResults?.annualPlan) || 0
    };
    
    // Format tier and AI type display names
    const aiTier = calculatorInputs?.aiTier || 'growth';
    const aiType = calculatorInputs?.aiType || 'chatbot';
    
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                    
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
      additionalVoiceMinutes: Number(calculatorInputs?.callVolume) || 0,
      includedVoiceMinutes: aiTier === 'starter' ? 0 : 600,
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
    
    // Save report to database using the lead ID as the exact identifier
    const reportData = {
      id: lead.id, // Use lead ID as report ID for exact lookup
      contact_name: lead.name,
      company_name: lead.company_name,
      email: lead.email,
      phone_number: lead.phone_number || null,
      calculator_inputs: lead.calculator_inputs,
      calculator_results: lead.calculator_results,
      report_date: new Date().toISOString()
    };
    
    console.log('[CALCULATOR REPORT] Saving report to database with ID:', reportData.id);
    
    // Save to database using upsert 
    const { error } = await supabase
      .from('generated_reports')
      .upsert([reportData as any]);
      
    if (error) {
      console.error('[CALCULATOR REPORT] Error saving report to database:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    } else {
      console.log('[CALCULATOR REPORT] Report saved to database successfully with ID:', lead.id);
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
