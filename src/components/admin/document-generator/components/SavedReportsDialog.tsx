
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { useSavedReports } from "../hooks/useSavedReports";
import { format } from "date-fns";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { generatePDF } from "@/components/calculator/pdf";
import { getSafeFileName } from "../hooks/report-generator/saveReport";

interface SavedReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedReportsDialog = ({ lead, isOpen, onClose }: SavedReportsDialogProps) => {
  const { reports, isLoading } = useSavedReports(lead.id);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  
  // Get the single report if available
  const report = reports.length > 0 ? reports[0] : null;

  const handleDownloadOriginalReport = async (reportId: string) => {
    try {
      setDownloadLoading(reportId);
      
      console.log("Downloading original report with ID:", reportId);
      
      // Create or get the report data
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
      
      // Use the exact same data from the report to create a PDF
      // This ensures we're using EXACTLY what was saved with no recalculation
      const exactSavedLead: Lead = {
        ...lead,
        id: reportId,
        name: reportData.contact_name,
        company_name: reportData.company_name,
        email: reportData.email,
        phone_number: reportData.phone_number || "",
        calculator_inputs: reportData.calculator_inputs || {},
        calculator_results: reportData.calculator_results || {},
      };
      
      // Generate the PDF directly using the saved data with absolutely no modifications
      console.log("Creating PDF with exact saved data, no recalculation:", exactSavedLead);
      
      // Use the exact saved values from the report with no calculations
      const doc = generatePDF({
        contactInfo: exactSavedLead.name || 'Valued Client',
        companyName: exactSavedLead.company_name || 'Your Company',
        email: exactSavedLead.email || 'client@example.com',
        phoneNumber: exactSavedLead.phone_number || '',
        industry: exactSavedLead.industry || 'Other',
        employeeCount: Number(exactSavedLead.employee_count) || 5,
        results: exactSavedLead.calculator_results,
        additionalVoiceMinutes: exactSavedLead.calculator_inputs?.callVolume || 0,
        includedVoiceMinutes: exactSavedLead.calculator_inputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: exactSavedLead.calculator_inputs?.aiTier === 'starter' ? 'Starter Plan' : 
                 exactSavedLead.calculator_inputs?.aiTier === 'growth' ? 'Growth Plan' : 
                 exactSavedLead.calculator_inputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: exactSavedLead.calculator_inputs?.aiType === 'chatbot' ? 'Text Only' : 
                exactSavedLead.calculator_inputs?.aiType === 'voice' ? 'Basic Voice' : 
                exactSavedLead.calculator_inputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                exactSavedLead.calculator_inputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                exactSavedLead.calculator_inputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save file with proper naming
      const safeCompanyName = getSafeFileName(exactSavedLead);
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

  const handleGenerateNewReport = () => {
    try {
      // Generate a new report based on current lead data
      import('@/utils/reportGenerator').then(module => {
        module.generateAndDownloadReport(lead);
      });
    } catch (error) {
      console.error("Error generating new report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report for {lead.company_name}</DialogTitle>
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
            <div className="text-center py-6 text-gray-500">
              No saved report found for this lead.
              <div className="mt-4">
                <button
                  onClick={handleGenerateNewReport}
                  className="flex items-center px-4 py-2 mx-auto bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Generate New ROI Report
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
