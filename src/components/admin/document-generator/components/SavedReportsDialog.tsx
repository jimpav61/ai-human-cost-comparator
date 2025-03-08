
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { useSavedReports } from "../hooks/useSavedReports";
import { generateAndDownloadReport } from "@/utils/reportGenerator";
import { format } from "date-fns";
import { Download, FileBarChart, Loader2 } from "lucide-react";

interface SavedReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const SavedReportsDialog = ({ lead, isOpen, onClose }: SavedReportsDialogProps) => {
  const { reports, isLoading } = useSavedReports(lead.id);

  const handleDownloadReport = () => {
    try {
      // Use the same report generator function that's used in the frontend
      // This ensures the exact same report is downloaded
      generateAndDownloadReport(lead);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reports for {lead.company_name}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map(report => (
                <div key={report.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium">{report.company_name}</div>
                    <div className="text-sm text-gray-500">
                      {report.report_date && format(new Date(report.report_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadReport}
                    className="flex items-center p-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No reports found for this lead.
              <div className="mt-4">
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center px-4 py-2 mx-auto bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Generate ROI Report
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
