
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./hooks/report-generator/saveReport";
import { JsPDFWithAutoTable } from "@/components/calculator/pdf/types";
import { generatePDF } from "@/components/calculator/pdf";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------");
      console.log("Searching for report with lead ID:", lead.id);
      
      // Query to find the exact report matching the lead ID
      const { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      if (error) {
        console.error("Database query error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Database query response:", existingReport ? "Report found" : "No report found");
      
      if (!existingReport) {
        throw new Error("No saved report found for this lead.");
      }
      
      // Report exists, generate PDF using the saved data
      console.log("Generating PDF from saved report data");
      
      // Extract calculator data from the saved report
      const calculatorResults = existingReport.calculator_results;
      const calculatorInputs = existingReport.calculator_inputs;
      
      console.log("Report calculator results:", calculatorResults);
      console.log("Report calculator inputs:", calculatorInputs);
      
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
      
      // Generate the PDF from the saved report data
      const doc = generatePDF({
        contactInfo: existingReport.contact_name || 'Valued Client',
        companyName: existingReport.company_name || 'Your Company',
        email: existingReport.email || 'client@example.com',
        phoneNumber: existingReport.phone_number || '',
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
      
      // Save the PDF with proper company name
      const safeCompanyName = getSafeFileName(lead);
      console.log("Report download successful, saving as:", `${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "The saved report has been successfully downloaded.",
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
