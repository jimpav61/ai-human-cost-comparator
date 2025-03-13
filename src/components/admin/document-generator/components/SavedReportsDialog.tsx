
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { useSavedReports } from "../hooks/useSavedReports";
import { format } from "date-fns";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateAndDownloadReport } from "@/utils/report/generateReport";
import { getSafeFileName } from "@/utils/report/validation";

interface SavedReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedReportsDialog = ({ lead, isOpen, onClose }: SavedReportsDialogProps) => {
  const { reports, isLoading } = useSavedReports(lead.id);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  
  const report = reports.length > 0 ? reports[0] : null;

  const handleDownloadSavedReport = async (reportId: string) => {
    try {
      setDownloadLoading(reportId);
      
      console.log("Downloading saved report with ID:", reportId);
      
      const reportData = reports.find(r => r.id === reportId);
      
      if (!reportData) {
        throw new Error("Report data not found");
      }
      
      console.log("Found report data for download:", reportData);
      
      if (reportData.pdf_url) {
        console.log("Using stored PDF file:", reportData.pdf_url);
        
        try {
          const response = await fetch(reportData.pdf_url, { method: 'HEAD' });
          if (!response.ok) {
            console.error(`PDF URL returned ${response.status}: ${reportData.pdf_url}`);
            throw new Error(`PDF file not found (status ${response.status})`);
          }
        } catch (fetchError) {
          console.error("Error checking PDF URL:", fetchError);
          throw new Error("PDF file could not be accessed. Regenerating report...");
        }
        
        const link = document.createElement('a');
        link.href = reportData.pdf_url;
        link.download = `${getSafeFileName(lead)}-ChatSites-ROI-Report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: "Saved report downloaded successfully",
        });
        return;
      }
      
      console.log("No PDF URL found, regenerating report from saved data");
      const tempLead: Lead = {
        ...lead,
        calculator_inputs: reportData.calculator_inputs,
        calculator_results: reportData.calculator_results,
        name: reportData.contact_name || lead.name,
        company_name: reportData.company_name || lead.company_name,
        email: reportData.email || lead.email,
        phone_number: reportData.phone_number || lead.phone_number,
      };
      
      generateAndDownloadReport(tempLead);
      
      toast({
        title: "Success",
        description: "Saved report downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download report. Please try again.",
        variant: "destructive",
      });
      
      if (report && downloadLoading) {
        try {
          console.log("Attempting fallback to generate new report...");
          const tempLead: Lead = {
            ...lead,
            calculator_inputs: report.calculator_inputs,
            calculator_results: report.calculator_results,
            name: report.contact_name || lead.name,
            company_name: report.company_name || lead.company_name,
            email: report.email || lead.email,
            phone_number: report.phone_number || lead.phone_number,
          };
          
          generateAndDownloadReport(tempLead);
        } catch (fallbackError) {
          console.error("Fallback generation also failed:", fallbackError);
        }
      }
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleGenerateNewReport = () => {
    try {
      if (!lead.calculator_inputs || Object.keys(lead.calculator_inputs).length === 0 ||
          !lead.calculator_results || Object.keys(lead.calculator_results).length === 0) {
        toast({
          title: "Error",
          description: "This lead has no saved calculation results. Please edit the lead and add calculator data first.",
          variant: "destructive",
        });
        return;
      }
      
      generateAndDownloadReport(lead);
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
                  onClick={() => handleDownloadSavedReport(report.id)}
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
              <p>No saved report found for this lead.</p>
              <p className="text-sm mt-2">A new report can be generated if the lead has calculator data.</p>
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
