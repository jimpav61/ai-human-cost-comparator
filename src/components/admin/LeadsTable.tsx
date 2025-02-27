
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, FileDown, Phone, Globe, Mail, FileText, Calendar } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { generateProposal } from '@/components/calculator/proposalGenerator';
import { useState, useEffect } from 'react';

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
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

  const handleDownloadReport = async (lead: Lead) => {
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

  const handleGenerateProposal = async (lead: Lead) => {
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
  
  const exportToCSV = () => {
    try {
      // Create CSV header
      let csvContent = "Company Name,Contact Name,Email,Phone,Website,Industry,Employee Count,Date Added\n";
      
      // Add lead data
      leads.forEach(lead => {
        const row = [
          `"${lead.company_name || ''}"`,
          `"${lead.name || ''}"`,
          `"${lead.email || ''}"`,
          `"${lead.phone_number || ''}"`,
          `"${lead.website || ''}"`,
          `"${lead.industry || ''}"`,
          `"${lead.employee_count || ''}"`,
          `"${new Date(lead.created_at || Date.now()).toLocaleDateString()}"`
        ].join(',');
        
        csvContent += row + "\n";
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ChatSites-Leads-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Exported ${leads.length} leads to CSV`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Error",
        description: "Failed to export leads to CSV",
        variant: "destructive",
      });
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Format: "Jan 15, 2023 at 14:30"
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Lead Management</h2>
        <Button 
          onClick={exportToCSV}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          Export All to CSV
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.company_name}
                {lead.website && (
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 text-xs mt-1"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Website
                  </a>
                )}
              </TableCell>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.industry || "N/A"}</TableCell>
              <TableCell>{lead.employee_count || "N/A"}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  <a 
                    href={`mailto:${lead.email}`}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {lead.email}
                  </a>
                  {lead.phone_number && (
                    <a 
                      href={`tel:${lead.phone_number}`}
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {lead.phone_number}
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-gray-600 text-sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(lead.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant={downloadedReports.has(lead.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDownloadReport(lead)}
                    className={`flex items-center ${downloadedReports.has(lead.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {downloadedReports.has(lead.id) ? "Downloaded" : "Report"}
                  </Button>
                  <Button
                    variant={downloadedProposals.has(lead.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGenerateProposal(lead)}
                    className={`flex items-center ${downloadedProposals.has(lead.id) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    {downloadedProposals.has(lead.id) ? "Sent" : "Proposal"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
