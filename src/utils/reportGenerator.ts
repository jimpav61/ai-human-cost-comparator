
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
 * Shared utility function that generates and downloads a PDF report
 * for a lead using the same generator regardless of whether it's called
 * from the frontend or admin panel
 */
export const generateAndDownloadReport = async (lead: Lead) => {
  try {
    console.log('[SHARED REPORT] Generating report for lead:', lead);
    console.log('[SHARED REPORT] Lead ID:', lead.id);
    
    // Check if lead exists
    if (!lead) {
      throw new Error("Lead data is missing");
    }

    // First check if there's a saved report in the database using ONLY the exact lead ID
    console.log('[SHARED REPORT] Checking for existing saved report for lead ID:', lead.id);
    const { data: existingReport, error: reportError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', lead.id)
      .maybeSingle();
      
    if (reportError) {
      console.error('[SHARED REPORT] Error fetching existing report:', reportError);
    }
    
    // If we found a saved report, use that exact saved data
    if (existingReport) {
      console.log('[SHARED REPORT] Found existing report with ID:', existingReport.id);
      
      // Safely cast JSON data to expected types with proper type assertions
      const calculatorInputs = existingReport.calculator_inputs as unknown as Record<string, any>;
      
      // Create a sanitized CalculationResults object from JSON
      const rawCalculatorResults = existingReport.calculator_results as unknown as Record<string, any>;
      const calculatorResults: CalculationResults = {
        aiCostMonthly: {
          voice: rawCalculatorResults?.aiCostMonthly?.voice || 0,
          chatbot: rawCalculatorResults?.aiCostMonthly?.chatbot || 0,
          total: rawCalculatorResults?.aiCostMonthly?.total || 0,
          setupFee: rawCalculatorResults?.aiCostMonthly?.setupFee || 0
        },
        basePriceMonthly: rawCalculatorResults?.basePriceMonthly || 0,
        humanCostMonthly: rawCalculatorResults?.humanCostMonthly || 0,
        monthlySavings: rawCalculatorResults?.monthlySavings || 0,
        yearlySavings: rawCalculatorResults?.yearlySavings || 0,
        savingsPercentage: rawCalculatorResults?.savingsPercentage || 0,
        breakEvenPoint: {
          voice: rawCalculatorResults?.breakEvenPoint?.voice || 0,
          chatbot: rawCalculatorResults?.breakEvenPoint?.chatbot || 0
        },
        humanHours: {
          dailyPerEmployee: rawCalculatorResults?.humanHours?.dailyPerEmployee || 0,
          weeklyTotal: rawCalculatorResults?.humanHours?.weeklyTotal || 0,
          monthlyTotal: rawCalculatorResults?.humanHours?.monthlyTotal || 0,
          yearlyTotal: rawCalculatorResults?.humanHours?.yearlyTotal || 0
        },
        annualPlan: rawCalculatorResults?.annualPlan || 0
      };
      
      // Generate PDF using the saved report data
      const doc = generatePDF({
        contactInfo: existingReport.contact_name || lead.name || 'Valued Client',
        companyName: existingReport.company_name || lead.company_name || 'Your Company',
        email: existingReport.email || lead.email || 'client@example.com',
        phoneNumber: existingReport.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults,
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: calculatorInputs?.aiTier === 'starter' ? 'Starter Plan' : 
                 calculatorInputs?.aiTier === 'growth' ? 'Growth Plan' : 
                 calculatorInputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: calculatorInputs?.aiType === 'chatbot' ? 'Text Only' : 
                calculatorInputs?.aiType === 'voice' ? 'Basic Voice' : 
                calculatorInputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorInputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorInputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save file with proper naming
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Success",
        description: `Downloaded saved report for ${lead.company_name || 'Client'}`,
        variant: "default",
      });
      
      return true;
    }
    
    // If no saved report, check if we can generate from current lead data
    if (!canGenerateReport(lead)) {
      throw new Error("This lead has no saved calculation results");
    }

    // Use the saved calculator inputs and results directly without recalculation
    const calculatorInputs = lead.calculator_inputs as unknown as Record<string, any>;
    const aiTier = calculatorInputs?.aiTier || 'growth';
    const aiType = calculatorInputs?.aiType || 'chatbot';
    
    // Format tier and AI type display names
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                    
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                          aiType === 'voice' ? 'Basic Voice' : 
                          aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                          aiType === 'both' ? 'Text & Basic Voice' : 
                          aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';

    // Create a safely typed CalculationResults object from JSON
    const rawCalculatorResults = lead.calculator_results as unknown as Record<string, any>;
    const calculatorResults: CalculationResults = {
      aiCostMonthly: {
        voice: rawCalculatorResults?.aiCostMonthly?.voice || 0,
        chatbot: rawCalculatorResults?.aiCostMonthly?.chatbot || 0,
        total: rawCalculatorResults?.aiCostMonthly?.total || 0,
        setupFee: rawCalculatorResults?.aiCostMonthly?.setupFee || 0
      },
      basePriceMonthly: rawCalculatorResults?.basePriceMonthly || 0,
      humanCostMonthly: rawCalculatorResults?.humanCostMonthly || 0,
      monthlySavings: rawCalculatorResults?.monthlySavings || 0,
      yearlySavings: rawCalculatorResults?.yearlySavings || 0,
      savingsPercentage: rawCalculatorResults?.savingsPercentage || 0,
      breakEvenPoint: {
        voice: rawCalculatorResults?.breakEvenPoint?.voice || 0,
        chatbot: rawCalculatorResults?.breakEvenPoint?.chatbot || 0
      },
      humanHours: {
        dailyPerEmployee: rawCalculatorResults?.humanHours?.dailyPerEmployee || 0,
        weeklyTotal: rawCalculatorResults?.humanHours?.weeklyTotal || 0,
        monthlyTotal: rawCalculatorResults?.humanHours?.monthlyTotal || 0,
        yearlyTotal: rawCalculatorResults?.humanHours?.yearlyTotal || 0
      },
      annualPlan: rawCalculatorResults?.annualPlan || 0
    };
    
    // Generate the PDF
    const doc = generatePDF({
      contactInfo: lead.name || 'Valued Client',
      companyName: lead.company_name || 'Your Company',
      email: lead.email || 'client@example.com',
      phoneNumber: lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: calculatorResults,
      additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
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
    
    console.log('[SHARED REPORT] Saving report to database with ID:', reportData.id);
    console.log('[SHARED REPORT] Full report data:', JSON.stringify(reportData));
    
    // Save to database using upsert to ensure we don't duplicate
    const { error } = await supabase
      .from('generated_reports')
      .upsert([reportData as any]);
      
    if (error) {
      console.error('[SHARED REPORT] Error saving report to database:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    } else {
      console.log('[SHARED REPORT] Report saved to database successfully with ID:', lead.id);
    }
    
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
