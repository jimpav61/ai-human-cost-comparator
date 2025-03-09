
import { Lead } from "@/types/leads";
import { DocumentGeneratorProps } from "./types";
import { Button } from "@/components/ui/button";
import { FileBarChart, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./hooks/report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { CalculationResults } from "@/hooks/calculator/types";

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProposalLoading, setIsProposalLoading] = useState(false);
  
  const handleDownloadReport = async () => {
    try {
      setIsLoading(true);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------");
      console.log("Searching for report with lead ID:", lead.id);
      
      // First try finding report by exact ID match
      let { data: existingReport, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .maybeSingle();
      
      // If not found by ID, try finding by email and company name as fallback
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
          // Use the most recent report if multiple exist
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
      
      // Report exists, generate PDF using the saved data
      console.log("Generating PDF from saved report data");
      
      // Extract calculator data from the saved report
      const calculatorResults = existingReport.calculator_results as Record<string, any>;
      const calculatorInputs = existingReport.calculator_inputs as Record<string, any>;
      
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
      
      // Create a safely typed CalculationResults object from the data
      const typedCalculatorResults: CalculationResults = {
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
        annualPlan: Number(calculatorResults?.annualPlan) || 0
      };
      
      // Generate the PDF from the saved report data
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
  
  const handleDownloadProposal = async () => {
    try {
      setIsProposalLoading(true);
      console.log("---------- ADMIN PROPOSAL DOWNLOAD ATTEMPT ----------");
      console.log("Generating proposal for lead ID:", lead.id);
      
      // Make a request to the proposal edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-proposal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ lead })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate proposal: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Proposal generated successfully:", result.message);
      
      toast({
        title: "Proposal Sent",
        description: "The proposal has been sent to the client's email.",
      });
      
    } catch (error) {
      console.error("Error generating proposal:", error);
      toast({
        title: "Proposal Generation Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate the proposal.",
        variant: "destructive",
      });
    } finally {
      setIsProposalLoading(false);
      console.log("---------- ADMIN PROPOSAL DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  return (
    <div className="flex gap-2">
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
      
      <Button
        onClick={handleDownloadProposal}
        disabled={isProposalLoading}
        variant="outline"
        size="sm"
        className="flex items-center"
      >
        <FileText className="h-4 w-4 mr-2" />
        {isProposalLoading ? "Sending..." : "Send Proposal"}
      </Button>
    </div>
  );
};
