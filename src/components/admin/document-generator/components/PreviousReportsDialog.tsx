
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { FileBarChart, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generatePDF } from "@/components/calculator/pdf";
import { ensureCalculationResults } from "@/components/calculator/pdf/types";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";

interface ReportRecord {
  id: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone_number: string;
  calculator_inputs: any;
  calculator_results: any;
  report_date: string;
}

interface PreviousReportsDialogProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const PreviousReportsDialog = ({ lead, isOpen, onClose }: PreviousReportsDialogProps) => {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen, lead.id]);

  const loadReports = async () => {
    setIsLoading(true);
    
    try {
      console.log("Loading reports for lead:", lead.email);
      
      // First try finding by lead ID
      let { data: reportsByLeadId, error: idError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', lead.id)
        .order('report_date', { ascending: false });
        
      if (idError) {
        console.error("Error fetching reports by ID:", idError);
      }
      
      // Then try finding by email and company name
      let { data: reportsByEmail, error: emailError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('email', lead.email)
        .eq('company_name', lead.company_name)
        .order('report_date', { ascending: false });
      
      if (emailError) {
        console.error("Error fetching reports by email:", emailError);
      }
      
      // Combine results, removing duplicates
      const combinedReports = [];
      const reportIds = new Set();
      
      if (reportsByLeadId?.length) {
        reportsByLeadId.forEach(report => {
          if (!reportIds.has(report.id)) {
            reportIds.add(report.id);
            combinedReports.push(report);
          }
        });
      }
      
      if (reportsByEmail?.length) {
        reportsByEmail.forEach(report => {
          if (!reportIds.has(report.id)) {
            reportIds.add(report.id);
            combinedReports.push(report);
          }
        });
      }
      
      console.log(`Found ${combinedReports.length} reports for lead ${lead.name}`);
      setReports(combinedReports);
      
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({
        title: "Error",
        description: "Failed to load report history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (report: ReportRecord) => {
    try {
      console.log("Downloading report:", report.id);
      
      const calculatorResults = report.calculator_results;
      const calculatorInputs = report.calculator_inputs;
      const aiTier = calculatorInputs?.aiTier || calculatorResults?.tierKey || 'growth';
      const aiType = calculatorInputs?.aiType || calculatorResults?.aiType || 'chatbot';
      
      // Extract additional voice minutes
      let additionalVoiceMinutes = 0;
      if (calculatorResults && 'additionalVoiceMinutes' in calculatorResults) {
        additionalVoiceMinutes = Number(calculatorResults.additionalVoiceMinutes);
      } else if (calculatorInputs && 'callVolume' in calculatorInputs) {
        additionalVoiceMinutes = Number(calculatorInputs.callVolume);
      }
      
      const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                       aiTier === 'growth' ? 'Growth Plan' : 
                       aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                       
      const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                            aiType === 'voice' ? 'Basic Voice' : 
                            aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                            aiType === 'both' ? 'Text & Basic Voice' : 
                            aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
      
      const typedCalculatorResults = ensureCalculationResults(calculatorResults);
      
      const doc = generatePDF({
        contactInfo: report.contact_name || 'Valued Client',
        companyName: report.company_name || 'Your Company',
        email: report.email || 'client@example.com',
        phoneNumber: report.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: typedCalculatorResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
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
      
      // Format the date
      const reportDate = new Date(report.report_date);
      const formattedDate = format(reportDate, 'yyyyMMdd-HHmm');
      
      // Create filename with date to distinguish between versions
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report-${formattedDate}.pdf`);
      
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded.",
        duration: 1000,
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report History for {lead.name}</DialogTitle>
          <DialogDescription>
            View and download previous reports generated for this lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <FileBarChart className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p>No report history found for this lead.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div key={report.id + index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{report.company_name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{format(new Date(report.report_date), 'PPP p')}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Plan: </span>
                        {(report.calculator_results?.tierKey || report.calculator_inputs?.aiTier) === 'starter' ? 'Starter' : 
                         (report.calculator_results?.tierKey || report.calculator_inputs?.aiTier) === 'growth' ? 'Growth' : 
                         (report.calculator_results?.tierKey || report.calculator_inputs?.aiTier) === 'premium' ? 'Premium' : 'N/A'}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
