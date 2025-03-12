
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { CalculationResults } from "@/hooks/calculator/types";
import { ensureCalculatorInputs } from "@/hooks/calculator/supabase-types";
import { ensureCalculationResults } from "@/components/calculator/pdf/types";
import { performCalculations } from "@/hooks/calculator/calculations";
import { toJson } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
      console.log('Lead data for report:', lead);
      
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
      
      console.log("Creating new report version:", nextVersion);
      
      // Generate a new unique ID for this report version
      const reportId = crypto.randomUUID();
      console.log("Generated new report ID:", reportId);
      
      // Ensure we're using the latest lead data for the report
      console.log("Generating new report with latest lead data");
      
      // Ensure calculator_inputs and calculator_results are properly prepared
      const calculatorInputs = lead.calculator_inputs || {};
      const calculatorResults = lead.calculator_results || {};
      
      // Extract key data points with type checking
      const aiTier = 
        (calculatorInputs && 'aiTier' in calculatorInputs) ? calculatorInputs.aiTier : 
        (calculatorResults && 'tierKey' in calculatorResults) ? calculatorResults.tierKey : 
        'growth';
        
      const aiType = 
        (calculatorInputs && 'aiType' in calculatorInputs) ? calculatorInputs.aiType : 
        (calculatorResults && 'aiType' in calculatorResults) ? calculatorResults.aiType : 
        'chatbot';
      
      // Determine additional voice minutes
      let additionalVoiceMinutes = 0;
      if (calculatorResults && 'additionalVoiceMinutes' in calculatorResults) {
        additionalVoiceMinutes = Number(calculatorResults.additionalVoiceMinutes);
      } else if (calculatorInputs && 'callVolume' in calculatorInputs) {
        additionalVoiceMinutes = Number(calculatorInputs.callVolume);
      }
      
      console.log("Using tierKey:", aiTier);
      console.log("Using aiType:", aiType);
      console.log("Using additionalVoiceMinutes:", additionalVoiceMinutes);
      
      // Ensure 1:1 replacement model by setting numEmployees to 1
      const adjustedInputs = { ...calculatorInputs, numEmployees: 1 };
      
      // Set proper pricing based on tier
      let setupFee = 0;
      let basePrice = 0;
      
      // Assign proper pricing values based on tier
      if (aiTier === 'starter') {
        setupFee = 499;
        basePrice = 149;
      } else if (aiTier === 'growth') {
        setupFee = 749;
        basePrice = 229;
      } else if (aiTier === 'premium') {
        setupFee = 1499;
        basePrice = 399;
      }
      
      // Create a proper typed object for the calculator results to use in recalculation
      let typedCalculatorResults: CalculationResults = {
        aiCostMonthly: {
          voice: aiType.includes('voice') ? 0.12 * additionalVoiceMinutes : 0,
          chatbot: basePrice,
          total: basePrice + (aiType.includes('voice') ? 0.12 * additionalVoiceMinutes : 0),
          setupFee: setupFee
        },
        basePriceMonthly: basePrice,
        humanCostMonthly: 0, // Will be recalculated
        monthlySavings: 0, // Will be recalculated
        yearlySavings: 0, // Will be recalculated
        savingsPercentage: 0, // Will be recalculated
        breakEvenPoint: {
          voice: 0,
          chatbot: 0
        },
        humanHours: {
          dailyPerEmployee: 0,
          weeklyTotal: 0,
          monthlyTotal: 0,
          yearlyTotal: 0
        },
        annualPlan: basePrice * 10, // 10 months equivalent for annual plan
        includedVoiceMinutes: aiTier === 'starter' ? 0 : 600,
        tierKey: aiTier as 'starter' | 'growth' | 'premium',
        aiType: aiType as 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium',
        additionalVoiceMinutes: additionalVoiceMinutes
      };
      
      // Use values from calculatorResults if they exist and are not zero
      if (calculatorResults?.aiCostMonthly?.setupFee > 0) {
        typedCalculatorResults.aiCostMonthly.setupFee = calculatorResults.aiCostMonthly.setupFee;
      }
      
      if (calculatorResults?.basePriceMonthly > 0) {
        typedCalculatorResults.basePriceMonthly = calculatorResults.basePriceMonthly;
      }
      
      if (calculatorResults?.annualPlan > 0) {
        typedCalculatorResults.annualPlan = calculatorResults.annualPlan;
      }
      
      // Recalculate results to ensure consistency
      try {
        const validInputs = ensureCalculatorInputs(adjustedInputs);
        const recalculatedResults = performCalculations(validInputs, {});
        
        // Make sure humanCostMonthly is properly set
        if (calculatorResults.humanCostMonthly && calculatorResults.humanCostMonthly > 0) {
          typedCalculatorResults.humanCostMonthly = calculatorResults.humanCostMonthly;
        } else {
          // If no humanCostMonthly is set, let's use the recalculated value or set a default
          typedCalculatorResults.humanCostMonthly = recalculatedResults.humanCostMonthly > 0 ? 
            recalculatedResults.humanCostMonthly : 
            typedCalculatorResults.basePriceMonthly * 3; // 3x the base price as a default
        }
        
        // Recalculate savings
        const aiTotalCost = typedCalculatorResults.aiCostMonthly.total;
        typedCalculatorResults.monthlySavings = typedCalculatorResults.humanCostMonthly - aiTotalCost;
        typedCalculatorResults.yearlySavings = typedCalculatorResults.monthlySavings * 12;
        typedCalculatorResults.savingsPercentage = 
          (typedCalculatorResults.monthlySavings / typedCalculatorResults.humanCostMonthly) * 100;
        
        // Make sure aiType and tierKey are set correctly
        typedCalculatorResults.aiType = aiType as 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
        typedCalculatorResults.tierKey = aiTier as 'starter' | 'growth' | 'premium';
        typedCalculatorResults.additionalVoiceMinutes = additionalVoiceMinutes;
      } catch (calcError) {
        console.error("Error recalculating results:", calcError);
        // Continue with existing results if recalculation fails
      }
      
      // Format tier and AI type display names
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
        results: typedCalculatorResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
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
      
      // Save a copy of this report to the database
      try {
        // Convert calculator data to JSON format
        const jsonInputs = toJson(adjustedInputs);
        const jsonResults = toJson(typedCalculatorResults);
        
        // Create the report data with the generated UUID and lead reference
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
        
        console.log("Saving new report version to database:", reportData);
        
        // Insert the new report version
        const { error } = await supabase
          .from('generated_reports')
          .insert(reportData);
          
        if (error) {
          console.error("Error saving report to database:", error);
        } else {
          console.log("Report saved successfully with ID:", reportData.id, "and version:", nextVersion);
        }
      } catch (dbError) {
        console.error("Database operation error:", dbError);
      }
      
      // Save the PDF for download
      const safeCompanyName = getSafeFileName(lead);
      const versionLabel = nextVersion ? `-v${nextVersion}` : '';
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report${versionLabel}.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "The latest report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate report.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return {
    isLoading,
    handleDownloadReport
  };
};
