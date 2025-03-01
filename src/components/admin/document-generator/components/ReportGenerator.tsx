
import { Lead } from "@/types/leads";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DownloadButton } from "./DownloadButton";
import { useDownloadState } from "../hooks/useDownloadState";

interface ReportGeneratorProps {
  lead: Lead;
}

export const ReportGenerator = ({ lead }: ReportGeneratorProps) => {
  const { hasDownloaded, markAsDownloaded } = useDownloadState({
    storageKey: 'downloadedReports',
    leadId: lead.id
  });

  const handleDownloadReport = async () => {
    try {
      // Create default values for missing data
      const defaultResults = {
        aiCostMonthly: { voice: 85, chatbot: 199, total: 284 },
        humanCostMonthly: 3800,
        monthlySavings: 3516,
        yearlySavings: 42192,
        savingsPercentage: 92.5,
        breakEvenPoint: { voice: 240, chatbot: 520 },
        humanHours: {
          dailyPerEmployee: 8,
          weeklyTotal: 200,
          monthlyTotal: 850,
          yearlyTotal: 10200
        }
      };
      
      // Use actual data if available, otherwise use defaults
      const results = lead.calculator_results && Object.keys(lead.calculator_results).length > 0 
        ? lead.calculator_results 
        : defaultResults;
      
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

  return (
    <DownloadButton
      hasDownloaded={hasDownloaded}
      label="Report"
      downloadedLabel="Downloaded"
      icon={<Download className="h-4 w-4 mr-1" />}
      onClick={handleDownloadReport}
    />
  );
};
