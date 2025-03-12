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

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------");
      console.log("Searching for report with lead ID:", lead.id);
      
      let { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (!existingReport && !error) {
        console.log("No report found by lead ID, trying to find by email:", lead.email);
        const { data: reportsByEmail, error: emailError } = await supabase
          .from('generated_reports')
          .select('*')
          .eq('email', lead.email)
          .eq('company_name', lead.company_name);
          
        if (emailError) {
          console.error("Error in fallback query:", emailError);
        } else if (reportsByEmail && reportsByEmail.length > 0) {
          console.log(`Found ${reportsByEmail.length} reports by email and company name`);
          existingReport = reportsByEmail.sort((a, b) => 
            new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
          )[0];
        }
      }
      
      if (error) {
        console.error("Database query error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Database query response:", existingReport ? "Report found" : "No report found");
      
      if (!existingReport) {
        throw new Error("No saved report found for this lead.");
      }
      
      console.log("Generating PDF from saved report data");
      
      const calculatorResults = existingReport.calculator_results as Record<string, any>;
      const calculatorInputs = existingReport.calculator_inputs as Record<string, any>;
      
      console.log("Report calculator results:", calculatorResults);
      console.log("Report calculator inputs:", calculatorInputs);
      
      // CRITICAL: Ensure 1:1 replacement model
      // Force numEmployees to 1 for calculation
      if (calculatorInputs) {
        calculatorInputs.numEmployees = 1;
        
        // Recalculate using the 1:1 replacement model
        try {
          const validInputs = ensureCalculatorInputs(calculatorInputs);
          const recalculatedResults = performCalculations(validInputs, {});
          console.log("Recalculated results with 1:1 replacement model:", recalculatedResults);
          calculatorResults.humanCostMonthly = recalculatedResults.humanCostMonthly;
          calculatorResults.monthlySavings = recalculatedResults.monthlySavings;
          calculatorResults.yearlySavings = recalculatedResults.yearlySavings;
          calculatorResults.savingsPercentage = recalculatedResults.savingsPercentage;
        } catch (calcError) {
          console.error("Error recalculating results:", calcError);
          // Continue with existing results if recalculation fails
        }
      }
      
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
      
      const partialResults: Partial<CalculationResults> = {
        aiCostMonthly: {
          voice: Number(calculatorResults?.aiCostMonthly?.voice) || 0,
          chatbot: Number(calculatorResults?.aiCostMonthly?.chatbot) || 0,
          total: Number(calculatorResults?.aiCostMonthly?.total) || 0,
          setupFee: Number(calculatorResults?.aiCostMonthly?.setupFee) || 0
        },
        basePriceMonthly: Number(calculatorResults?.basePriceMonthly) || 0,
        humanCostMonthly: Number(calculatorResults?.humanCostMonthly) || 0,
        monthlySavings: Number(calculatorResults?.monthlySavings) || 0,
        yearlySavings: Number(calculatorResults?.yearlySavings) || 0,
        savingsPercentage: Number(calculatorResults?.savingsPercentage) || 0,
        breakEvenPoint: {
          voice: Number(calculatorResults?.breakEvenPoint?.voice) || 0,
          chatbot: Number(calculatorResults?.breakEvenPoint?.chatbot) || 0
        },
        humanHours: {
          dailyPerEmployee: Number(calculatorResults?.humanHours?.dailyPerEmployee) || 0,
          weeklyTotal: Number(calculatorResults?.humanHours?.weeklyTotal) || 0,
          monthlyTotal: Number(calculatorResults?.humanHours?.monthlyTotal) || 0,
          yearlyTotal: Number(calculatorResults?.humanHours?.yearlyTotal) || 0
        },
        annualPlan: Number(calculatorResults?.annualPlan) || 0,
        tierKey: (aiTier as "starter" | "growth" | "premium"),
        aiType: (aiType as "voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium")
      };
      
      const typedCalculatorResults = ensureCalculationResults(partialResults);
      
      const doc = generatePDF({
        contactInfo: existingReport.contact_name || 'Valued Client',
        companyName: existingReport.company_name || 'Your Company',
        email: existingReport.email || 'client@example.com',
        phoneNumber: existingReport.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: typedCalculatorResults,
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
      
      const safeCompanyName = getSafeFileName(lead);
      console.log("Report download successful, saving as:", `${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "The saved report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Report Not Found",
        description: error instanceof Error 
          ? error.message 
          : "No saved report exists for this lead.",
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

