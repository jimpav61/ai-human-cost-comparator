
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
    
    // FIXED REPORT SAVING: Always save if we have a valid lead ID, and always use that exact ID
    if (lead.id) {
      // Skip temp IDs to avoid cluttering the database
      if (lead.id === 'temp-id') {
        console.log('[CALCULATOR REPORT] Skipping database save for temporary lead ID');
      } else {
        // Create the report data with the lead ID
        const reportData = {
          id: lead.id, // Use lead ID as the primary key
          contact_name: lead.name,
          company_name: lead.company_name,
          email: lead.email,
          phone_number: lead.phone_number || null,
          calculator_inputs: lead.calculator_inputs,
          calculator_results: lead.calculator_results,
          report_date: new Date().toISOString()
        };
        
        console.log('[CALCULATOR REPORT] Saving report to database with ID:', reportData.id);
        
        try {
          // Check if a report already exists with this ID
          const { data: existingReport, error: lookupError } = await supabase
            .from('generated_reports')
            .select('id')
            .eq('id', lead.id)
            .maybeSingle();
            
          if (lookupError) {
            console.error('[CALCULATOR REPORT] Error checking for existing report:', lookupError);
          }
          
          let saveError;
          
          // Update or insert based on whether the report exists
          if (existingReport) {
            console.log('[CALCULATOR REPORT] Updating existing report with ID:', lead.id);
            const { error } = await supabase
              .from('generated_reports')
              .update(reportData)
              .eq('id', lead.id);
            saveError = error;
          } else {
            console.log('[CALCULATOR REPORT] Inserting new report with ID:', lead.id);
            const { error } = await supabase
              .from('generated_reports')
              .insert([reportData], { upsert: true }); // Use upsert to force the ID
            saveError = error;
          }
            
          if (saveError) {
            console.error('[CALCULATOR REPORT] Error saving report to database:', saveError);
            console.log('[CALCULATOR REPORT] Attempting alternative save method...');
            
            // If the first save method fails, try an upsert operation as a fallback
            const { error: upsertError } = await supabase
              .from('generated_reports')
              .upsert([reportData], { 
                onConflict: 'id', 
                ignoreDuplicates: false
              });
              
            if (upsertError) {
              console.error('[CALCULATOR REPORT] Alternative save method also failed:', upsertError);
            } else {
              console.log('[CALCULATOR REPORT] Report saved using alternative method with ID:', lead.id);
            }
          } else {
            console.log('[CALCULATOR REPORT] Report saved to database successfully with ID:', lead.id);
          }
        } catch (dbError) {
          console.error('[CALCULATOR REPORT] Database operation error:', dbError);
        }
      }
    } else {
      console.warn('[CALCULATOR REPORT] Cannot save report - lead ID is missing');
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
