
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { generatePDF } from "@/components/calculator/pdfGenerator";

interface Lead {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string | null;
  website: string | null;
  calculator_inputs: any;
  calculator_results: any;
  created_at: string;
  proposal_sent: boolean;
}

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = (lead: Lead) => {
    if (!lead.calculator_results || !lead.calculator_inputs) {
      toast({
        title: "No Report Available",
        description: "This lead hasn't completed the calculator yet.",
        variant: "destructive",
      });
      return;
    }

    const doc = generatePDF({
      contactInfo: lead.name,
      companyName: lead.company_name,
      email: lead.email,
      phoneNumber: lead.phone_number,
      results: lead.calculator_results,
      businessSuggestions: [], // Add your business suggestions logic here
      aiPlacements: [], // Add your AI placements logic here
    });

    doc.save(`${lead.company_name}-AI-Report.pdf`);
  };

  const handleMarkProposalSent = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ proposal_sent: true })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead marked as proposal sent",
      });

      // Refresh leads
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.company_name}</TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>
                  {lead.website && (
                    <a 
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {lead.website}
                    </a>
                  )}
                </TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone_number || '-'}</TableCell>
                <TableCell>
                  {new Date(lead.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {lead.proposal_sent ? (
                    <span className="text-green-600">Proposal Sent</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(lead)}
                    >
                      Download Report
                    </Button>
                    {!lead.proposal_sent && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarkProposalSent(lead.id)}
                      >
                        Mark Sent
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDashboard;
