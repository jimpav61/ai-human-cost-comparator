
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName } from "./hooks/report-generator/saveReport";
import { CalculationResults } from "@/hooks/calculator/types";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      
      // Only try to fetch existing report from database
      const { data: existingReport, error: reportError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (reportError) {
        console.error("Error checking for existing report:", reportError);
        throw new Error("Failed to check for existing report");
      }
      
      if (!existingReport) {
        console.error("No saved report found for this lead");
        throw new Error("No saved report found for this lead");
      }
      
      console.log("Found existing report, downloading:", existingReport);
      
      // Create a safely typed CalculationResults object from JSON
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
      
      // Safely cast JSON data to expected types
      const calculatorInputs = existingReport.calculator_inputs as unknown as Record<string, any>;
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

      // Generate the PDF from the saved report data
      const doc = generatePDF({
        contactInfo: existingReport.contact_name || lead.name || 'Valued Client',
        companyName: existingReport.company_name || lead.company_name || 'Your Company',
        email: existingReport.email || lead.email || 'client@example.com',
        phoneNumber: existingReport.phone_number || lead.phone_number || '',
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
      
      // Save file with proper naming
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Success",
        description: `Downloaded existing report for ${lead.company_name || 'Client'}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      onClick={handleDownloadReport}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="flex items-center"
    >
      <FileBarChart className="h-4 w-4 mr-2" />
      {isLoading ? "Downloading..." : "Download Report"}
    </Button>
  );
};
