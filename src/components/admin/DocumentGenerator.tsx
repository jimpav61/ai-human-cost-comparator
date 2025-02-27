
import { Lead } from "@/types/leads";
import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateProposal } from "@/components/calculator/proposalGenerator";
import { useState, useEffect } from "react";

interface DocumentGeneratorProps {
  lead: Lead;
}

export const DocumentGenerator = ({ lead }: DocumentGeneratorProps) => {
  const [downloadedReports, setDownloadedReports] = useState<Set<string>>(new Set());
  const [downloadedProposals, setDownloadedProposals] = useState<Set<string>>(new Set());
  
  // Load downloaded status from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('downloadedReports');
    const savedProposals = localStorage.getItem('downloadedProposals');
    
    if (savedReports) {
      setDownloadedReports(new Set(JSON.parse(savedReports)));
    }
    
    if (savedProposals) {
      setDownloadedProposals(new Set(JSON.parse(savedProposals)));
    }
  }, []);
  
  // Save downloaded status to localStorage
  const saveDownloadStatus = (type: 'reports' | 'proposals', items: Set<string>) => {
    localStorage.setItem(`downloaded${type === 'reports' ? 'Reports' : 'Proposals'}`, 
      JSON.stringify(Array.from(items)));
  };

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
      const newDownloadedReports = new Set(downloadedReports);
      newDownloadedReports.add(lead.id);
      setDownloadedReports(newDownloadedReports);
      saveDownloadStatus('reports', newDownloadedReports);

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

  const handleGenerateProposal = async () => {
    try {
      console.log('Generating proposal for lead:', lead);
      
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
      
      const doc = generateProposal({
        contactInfo: lead.name || 'Valued Client',
        companyName: lead.company_name || 'Your Company',
        email: lead.email || 'client@example.com',
        phoneNumber: lead.phone_number,
        industry: lead.industry,
        employeeCount: lead.employee_count,
        results: results,
      });
      
      doc.save(`${lead.company_name}-Proposal.pdf`);
      
      // Mark as downloaded
      const newDownloadedProposals = new Set(downloadedProposals);
      newDownloadedProposals.add(lead.id);
      setDownloadedProposals(newDownloadedProposals);
      saveDownloadStatus('proposals', newDownloadedProposals);

      toast({
        title: "Success",
        description: "Proposal generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Proposal generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate proposal",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={downloadedReports.has(lead.id) ? "default" : "outline"}
        size="sm"
        onClick={handleDownloadReport}
        className={`flex items-center ${downloadedReports.has(lead.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        <Download className="h-4 w-4 mr-1" />
        {downloadedReports.has(lead.id) ? "Downloaded" : "Report"}
      </Button>
      <Button
        variant={downloadedProposals.has(lead.id) ? "default" : "outline"}
        size="sm"
        onClick={handleGenerateProposal}
        className={`flex items-center ${downloadedProposals.has(lead.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        <FileDown className="h-4 w-4 mr-1" />
        {downloadedProposals.has(lead.id) ? "Sent" : "Proposal"}
      </Button>
    </div>
  );
};
