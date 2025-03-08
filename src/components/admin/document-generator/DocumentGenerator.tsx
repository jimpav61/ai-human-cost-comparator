
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { saveReportPDF } from "./hooks/report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { supabase } from "@/integrations/supabase/client";
import { CalculationResults } from "@/hooks/calculator/types";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's a saved report in the database
      const { data: existingReport, error: reportError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
        
      if (reportError) {
        throw new Error("Error fetching report");
      }
      
      if (!existingReport) {
        throw new Error("No saved report found for this lead");
      }
      
      // Parse the stored calculator results
      const calculatorInputs = existingReport.calculator_inputs as any;
      const rawCalculatorResults = existingReport.calculator_results as any;
      
      // Create the formatted PDF params object with required fields
      const pdfParams = {
        contactInfo: existingReport.contact_name || lead.name || 'Valued Client',
        companyName: existingReport.company_name || lead.company_name || 'Your Company',
        email: existingReport.email || lead.email || 'client@example.com',
        phoneNumber: existingReport.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: rawCalculatorResults as CalculationResults,
        aiType: calculatorInputs?.aiType === 'chatbot' ? 'Text Only' : 
                calculatorInputs?.aiType === 'voice' ? 'Basic Voice' : 
                calculatorInputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorInputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorInputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only',
        tierName: calculatorInputs?.aiTier === 'starter' ? 'Starter Plan' : 
                 calculatorInputs?.aiTier === 'growth' ? 'Growth Plan' : 
                 calculatorInputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
        // Add the required arrays for businessSuggestions and aiPlacements
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
        ]
      };
      
      // Generate the PDF with the properly formatted params
      const doc = generatePDF(pdfParams);
      
      // Save the document using the existing utility
      saveReportPDF(doc, lead);
      
      toast({
        title: "Success",
        description: `Saved report for ${lead.company_name || 'Client'} downloaded successfully`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download saved report. Please try again.",
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
