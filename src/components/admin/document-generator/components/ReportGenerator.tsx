
import { Lead } from "@/types/leads";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { Button } from "@/components/ui/button";

interface ReportGeneratorProps {
  lead: Lead;
  buttonStyle?: "default" | "large";
}

export const ReportGenerator = ({ lead, buttonStyle = "default" }: ReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedReports',
    leadId: lead.id
  });

  const handleDownloadReport = async () => {
    try {
      // Create default values for missing data
      const defaultResults = {
        aiCostMonthly: { voice: 0, chatbot: 99, total: 99, setupFee: 249 },
        humanCostMonthly: 3800,
        monthlySavings: 3701,
        yearlySavings: 44412,
        savingsPercentage: 97.4,
        breakEvenPoint: { voice: 0, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        },
        annualPlan: 990
      };
      
      // Use actual data if available, otherwise use defaults
      const results = lead.calculator_results && Object.keys(lead.calculator_results).length > 0 
        ? lead.calculator_results 
        : defaultResults;
      
      // Define inputs object for pricing details calculation
      const inputs = lead.calculator_inputs || {
        aiType: 'chatbot',
        aiTier: 'starter',
        role: 'customerService',
        numEmployees: 5,
        callVolume: 0, 
        avgCallDuration: 0,
        chatVolume: 2000,
        avgChatLength: 8,
        avgChatResolutionTime: 10
      };
      
      // Get tier and AI type display names
      const tierName = getTierDisplayName(inputs.aiTier);
      const aiType = getAITypeDisplay(inputs.aiType);
      
      // Import dynamically to avoid TypeScript errors
      const { generatePDF } = await import('@/components/calculator/pdfGenerator');
      
      const doc = generatePDF({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number,
        industry: lead.industry,
        employeeCount: lead.employee_count,
        results: results,
        tierName: tierName,
        aiType: aiType,
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
      });
      
      doc.save(`${lead.company_name}-Report.pdf`);
      
      // Mark as downloaded
      markAsDownloaded();

      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  // Return different button styles based on the buttonStyle prop
  if (buttonStyle === "large") {
    return (
      <Button
        onClick={handleDownloadReport}
        className="w-full flex items-center justify-center gap-2 py-3"
        variant={hasDownloaded ? "secondary" : "default"}
      >
        <Download className="h-5 w-5" />
        {hasDownloaded ? "Download Report" : "Download Report"}
      </Button>
    );
  }

  // Default button style for admin interface
  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="Report"
      downloadedLabel="Download"
      icon={<Download className="h-4 w-4 mr-1" />}
      onClick={handleDownloadReport}
    />
  );
};
