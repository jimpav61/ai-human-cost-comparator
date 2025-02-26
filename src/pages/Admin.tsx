
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText } from 'lucide-react';
import { generatePDF } from '@/components/calculator/pdfGenerator';
import type { LeadData } from '@/components/calculator/types';

interface Lead {
  id: string;
  name: string;
  company_name: string;
  email: string;
  website: string | null;
  phone_number: string | null;
  calculator_inputs: any;
  calculator_results: any;
  proposal_sent: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/');
        return;
      }

      try {
        const { data: adminCheck, error } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (error || !adminCheck) {
          throw new Error('Unauthorized');
        }

        // Fetch leads after confirming admin access
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;
        setLeads(leadsData || []);
        setLoading(false);
      } catch (error) {
        console.error('Access check error:', error);
        toast({
          title: "Unauthorized",
          description: "You don't have access to this page",
          variant: "destructive",
        });
        navigate('/');
      }
    };

    checkAccess();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = (lead: Lead) => {
    try {
      const leadData: LeadData = {
        name: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        phoneNumber: lead.phone_number || ''
      };

      const doc = generatePDF({
        contactInfo: leadData.name,
        companyName: leadData.companyName,
        email: leadData.email,
        phoneNumber: leadData.phoneNumber,
        results: lead.calculator_results,
        businessSuggestions: [
          {
            title: "24/7 Customer Support",
            description: "Implement AI to provide round-the-clock support without increasing staff costs."
          },
          {
            title: "Rapid Response Times",
            description: "AI can handle multiple inquiries simultaneously, reducing customer wait times."
          },
          {
            title: "Cost-Effective Scaling",
            description: "Save on operational costs while maintaining service quality."
          },
          {
            title: "Employee Focus",
            description: "Free up your team to handle complex cases while AI manages routine inquiries."
          }
        ],
        aiPlacements: [
          {
            role: "Front-line Support",
            capabilities: [
              "Handle routine customer inquiries instantly",
              "Route complex issues to human agents",
              "Available 24/7 without additional cost"
            ]
          },
          {
            role: "Customer Service Enhancement",
            capabilities: [
              "Reduce wait times significantly",
              "Process multiple requests simultaneously",
              "Maintain consistent service quality"
            ]
          }
        ]
      });

      doc.save(`${lead.company_name}-AI-Integration-Analysis.pdf`);
      
      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const handleCreateProposal = async (lead: Lead) => {
    try {
      // Update the lead's proposal_sent status
      await supabase
        .from('leads')
        .update({ proposal_sent: true })
        .eq('id', lead.id);

      // Refresh leads list
      const { data: updatedLeads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      setLeads(updatedLeads || []);

      toast({
        title: "Success",
        description: "Proposal status updated successfully",
      });
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.company_name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  {lead.website ? (
                    <a 
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {lead.website}
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {lead.phone_number ? (
                    <a 
                      href={`tel:${lead.phone_number}`}
                      className="text-blue-600 hover:underline"
                    >
                      {lead.phone_number}
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadReport(lead)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateProposal(lead)}
                      disabled={lead.proposal_sent}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
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
