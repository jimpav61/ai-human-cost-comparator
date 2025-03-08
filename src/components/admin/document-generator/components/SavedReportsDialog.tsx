
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { useSavedReports } from "../hooks/useSavedReports";
import { format } from "date-fns";
import { Download, FileBarChart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface SavedReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedReportsDialog = ({ lead, isOpen, onClose }: SavedReportsDialogProps) => {
  const { reports, isLoading } = useSavedReports(lead.id);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  const handleDownloadOriginalReport = async (reportId: string) => {
    try {
      setDownloadLoading(reportId);
      
      // Fetch the complete report data from the database
      const { data: reportData, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (error) throw error;
      
      if (!reportData) {
        throw new Error("Report data not found");
      }
      
      // Create a temporary lead object with the exact original calculator inputs and results
      const originalReportLead: Lead = {
        ...lead,
        calculator_inputs: reportData.calculator_inputs,
        calculator_results: reportData.calculator_results,
      };
      
      // Use the shared report generator with the ORIGINAL data
      const success = await import('@/utils/reportGenerator').then(module => {
        return module.generateAndDownloadReport(originalReportLead);
      });
      
      if (success) {
        toast({
          title: "Success",
          description: "Original report downloaded successfully",
        });
      }
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
          ) : reports.length > 0 ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {reports.map(report => (
                <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
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
                    Download Original Report
                  </button>
                </div>
              ))}
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
