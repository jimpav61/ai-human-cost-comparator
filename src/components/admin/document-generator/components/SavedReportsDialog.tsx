
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { useSavedReports } from "../hooks/useSavedReports";
import { format } from "date-fns";
import { Download, FileBarChart, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName } from "../hooks/report-generator/saveReport";
import { SharedResults } from "@/components/calculator/shared/types";

interface SavedReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedReportsDialog = ({ lead, isOpen, onClose }: SavedReportsDialogProps) => {
  const { reports, isLoading, refreshReports } = useSavedReports(lead.id);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  
  // Get the single report if available
  const report = reports.length > 0 ? reports[0] : null;

  const handleDownloadOriginalReport = async (reportId: string) => {
    try {
      setDownloadLoading(reportId);
      
      console.log("Downloading original report with ID:", reportId);
      
      // Find the report data
      const reportData = reports.find(r => r.id === reportId);
      
      if (!reportData) {
        throw new Error("Report data not found");
      }
      
      console.log("Found report data for download:", reportData);
      
      // Create a blob for the report data and download JSON
      const originalReportBlob = new Blob(
        [JSON.stringify(reportData, null, 2)], 
        { type: 'application/json' }
      );
      
      // Create a hidden link element to trigger the download
      const downloadUrl = URL.createObjectURL(originalReportBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${reportData.company_name.replace(/[^\w\s-]/gi, '')}-original-report-data.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      
      // Make sure calculator_inputs and calculator_results are properly typed
      const calculatorInputs = typeof reportData.calculator_inputs === 'string' 
        ? JSON.parse(reportData.calculator_inputs) 
        : reportData.calculator_inputs;
        
      const calculatorResults = typeof reportData.calculator_results === 'string'
        ? JSON.parse(reportData.calculator_results)
        : reportData.calculator_results;
      
      // Use the exact same data from the report to create a PDF
      const doc = generatePDF({
        contactInfo: reportData.contact_name || 'Valued Client',
        companyName: reportData.company_name || 'Your Company',
        email: reportData.email || 'client@example.com',
        phoneNumber: reportData.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults as SharedResults,
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: calculatorInputs?.aiTier === 'starter' ? 'Starter Plan' : 
                 calculatorInputs?.aiTier === 'growth' ? 'Growth Plan' : 
                 calculatorInputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: calculatorInputs?.aiType === 'chatbot' ? 'Text Only' : 
                calculatorInputs?.aiType === 'voice' ? 'Basic Voice' : 
                calculatorInputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorInputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorInputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save file with proper naming
      const safeCompanyName = reportData.company_name.replace(/[^\w\s-]/gi, '');
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Success",
        description: "Original saved report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report for {lead.company_name}</DialogTitle>
          <DialogDescription>
            View and download saved reports for this lead
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : report ? (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{report.company_name}</div>
                  <div className="text-sm text-gray-500">
                    {report.report_date && format(new Date(report.report_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadOriginalReport(report.id)}
                  disabled={downloadLoading === report.id}
                  className="flex items-center p-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  {downloadLoading === report.id ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Download Saved Report
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-gray-500">
              <p>No saved report found for this lead.</p>
              <p className="text-sm mt-2">The client needs to complete a calculation first.</p>
              <button
                onClick={refreshReports}
                className="mt-4 flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh Reports
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
