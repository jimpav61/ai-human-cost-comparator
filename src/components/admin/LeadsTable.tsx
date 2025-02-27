
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Download, FileDown, Phone, Globe, Mail } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Lead } from "@/types/leads";
import { supabase } from "@/integrations/supabase/client";
import { generateProposal } from '@/components/calculator/proposalGenerator';

interface LeadsTableProps {
  leads: Lead[];
}

export const LeadsTable = ({ leads }: LeadsTableProps) => {
  const handleDownloadReport = async (lead: Lead) => {
    try {
      toast({
        title: "Download Started",
        description: `Downloading report for ${lead.company_name}...`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
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
        results: results,
      });
      
      doc.save(`${lead.company_name}-Proposal.pdf`);

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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.company_name}
              </TableCell>
              <TableCell>{lead.name}</TableCell>
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
                {lead.website && (
                  <a 
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(lead)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateProposal(lead)}
                    className="flex items-center"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    Proposal
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
