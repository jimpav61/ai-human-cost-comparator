
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

    // Get the next version number for this lead
    const { data: existingReports, error: countError } = await supabase
      .from('generated_reports')
      .select('version')
      .eq('lead_id', lead.id)
      .order('version', { ascending: false })
      .limit(1);
      
    let nextVersion = 1;
    if (!countError && existingReports && existingReports.length > 0) {
      nextVersion = (existingReports[0].version || 0) + 1;
    }
    
    console.log('[CALCULATOR REPORT] Creating new report version:', nextVersion);

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
    
    // Generate a new unique report ID
    const reportId = crypto.randomUUID();
    console.log('[CALCULATOR REPORT] Generated new report ID:', reportId);
    
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
      
      // Create the report data with the lead reference
      const reportData = {
        id: reportId,
        lead_id: lead.id, 
        contact_name: lead.name,
        company_name: lead.company_name,
        email: lead.email,
        phone_number: lead.phone_number || null,
        calculator_inputs: jsonInputs,
        calculator_results: jsonResults,
        report_date: new Date().toISOString(),
        version: nextVersion
      };
      
      console.log('[CALCULATOR REPORT] Saving report to database with ID:', reportData.id);
      console.log('[CALCULATOR REPORT] Report lead_id:', reportData.lead_id);
      console.log('[CALCULATOR REPORT] Report data tierKey:', tierKey);
      console.log('[CALCULATOR REPORT] Report data aiType:', aiType);
      console.log('[CALCULATOR REPORT] Report data additionalVoiceMinutes:', additionalVoiceMinutes);
      console.log('[CALCULATOR REPORT] Report version:', nextVersion);
      
      try {
        const { error } = await supabase
          .from('generated_reports')
          .insert(reportData);
          
        if (error) {
          console.error('[CALCULATOR REPORT] Error saving report to database:', error);
        } else {
          console.log('[CALCULATOR REPORT] Report saved to database successfully with ID:', reportData.id);
          
          // IMPORTANT NEW STEP: Save the PDF to Supabase Storage
          try {
            console.log('[CALCULATOR REPORT] Saving PDF to storage');
            
            // First check if reports bucket exists, create it if not
            const { data: buckets } = await supabase.storage.listBuckets();
            const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
            
            if (!reportsBucketExists) {
              console.log('[CALCULATOR REPORT] Creating reports bucket');
              try {
                const { error: bucketError } = await supabase.storage.createBucket('reports', {
                  public: true,
                  fileSizeLimit: 10485760, // 10MB
                });
                
                if (bucketError) {
                  console.error('[CALCULATOR REPORT] Error creating reports bucket:', bucketError);
                } else {
                  console.log('[CALCULATOR REPORT] Reports bucket created successfully');
                }
              } catch (bucketCreateError) {
                console.error('[CALCULATOR REPORT] Bucket creation error:', bucketCreateError);
              }
            }
            
            // Get the PDF as a blob
            const pdfBlob = await new Promise<Blob>((resolve) => {
              // Convert the document to Blob format
              doc.output('blob', (blob: Blob) => {
                resolve(blob);
              });
            });
            
            // Upload the PDF to Supabase Storage
            const filePath = `reports/${reportId}.pdf`;
            const { error: uploadError } = await supabase.storage
              .from('reports')
              .upload(filePath, pdfBlob, {
                contentType: 'application/pdf',
                upsert: true
              });
            
            if (uploadError) {
              console.error('[CALCULATOR REPORT] Error uploading PDF to storage:', uploadError);
            } else {
              console.log('[CALCULATOR REPORT] PDF saved to storage successfully at path:', filePath);
              
              // Get the public URL for the uploaded file
              const { data: urlData } = await supabase.storage
                .from('reports')
                .getPublicUrl(filePath);
              
              console.log('[CALCULATOR REPORT] Stored PDF public URL:', urlData?.publicUrl);
            }
          } catch (storageError) {
            console.error('[CALCULATOR REPORT] Storage operation error:', storageError);
          }
        }
      } catch (dbError) {
        console.error('[CALCULATOR REPORT] Database operation error:', dbError);
      }
    } else {
      console.warn('[CALCULATOR REPORT] Cannot save report - failed to generate report ID');
    }
    
    // Save file with proper naming and version number
    const safeCompanyName = getSafeFileName(lead);
    const versionLabel = nextVersion ? `-v${nextVersion}` : '';
    doc.save(`${safeCompanyName}-ChatSites-ROI-Report${versionLabel}.pdf`);
    
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
