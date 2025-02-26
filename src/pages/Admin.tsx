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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

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
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchLeads();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "Please sign in to access the admin dashboard",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const fetchLeads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        throw error;
      }

      console.log('Fetched leads:', data); // Debug log
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
    
    toast({
      title: "Success",
      description: "Report downloaded successfully.",
    });
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

  const handleAddAdmin = async () => {
    try {
      const { error } = await supabase
        .from('allowed_admins')
        .insert([{ email: newAdminEmail }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "New admin added successfully",
      });

      setNewAdminEmail('');
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "Failed to add new admin",
        variant: "destructive",
      });
    }
  };

  const handleSendProposal = async (lead: Lead) => {
    try {
      // Generate personalized proposal
      const { data: proposal, error: proposalError } = await supabase.functions
        .invoke('generate-proposal', {
          body: {
            name: lead.name,
            company_name: lead.company_name,
            calculator_results: lead.calculator_results,
            calculator_inputs: lead.calculator_inputs
          }
        });

      if (proposalError) throw proposalError;

      // Create PDF using jsPDF
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(24);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text(proposal.title, 20, 20);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      const summaryLines = doc.splitTextToSize(proposal.summary, 170);
      doc.text(summaryLines, 20, 40);

      let currentY = 40 + (summaryLines.length * 7);

      // Savings Section
      doc.setFontSize(16);
      doc.setTextColor(55, 65, 81); // gray-700
      doc.text("Projected Savings", 20, currentY);
      
      currentY += 10;
      doc.setFontSize(12);
      doc.text(`Monthly: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(proposal.savings.monthly)}`, 20, currentY);
      currentY += 7;
      doc.text(`Yearly: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(proposal.savings.yearly)}`, 20, currentY);
      currentY += 7;
      doc.text(`Cost Reduction: ${Math.round(proposal.savings.percentage * 100)}%`, 20, currentY);

      // Recommendations Section
      currentY += 15;
      doc.setFontSize(16);
      doc.text("Recommendations", 20, currentY);
      
      proposal.recommendations.forEach(rec => {
        currentY += 12;
        doc.setFontSize(14);
        doc.setTextColor(75, 85, 99); // gray-600
        doc.text(rec.title, 20, currentY);
        
        currentY += 7;
        doc.setFontSize(12);
        doc.setTextColor(0);
        const descLines = doc.splitTextToSize(rec.description, 170);
        doc.text(descLines, 20, currentY);
        
        currentY += (descLines.length * 7) + 5;
        rec.benefits.forEach(benefit => {
          doc.text(`• ${benefit}`, 25, currentY);
          currentY += 7;
        });
      });

      // Implementation Timeline
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      currentY += 10;
      doc.setFontSize(16);
      doc.setTextColor(55, 65, 81);
      doc.text("Implementation Timeline", 20, currentY);
      
      currentY += 10;
      doc.setFontSize(12);
      doc.text(`Estimated timeline: ${proposal.implementation.timeline}`, 20, currentY);
      
      currentY += 10;
      proposal.implementation.phases.forEach((phase, index) => {
        doc.text(`${index + 1}. ${phase}`, 20, currentY);
        currentY += 7;
      });

      // Footer
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 15;
      }

      doc.setDrawColor(229, 231, 235); // gray-200
      doc.line(20, currentY, 190, currentY);
      
      currentY += 10;
      doc.setFontSize(12);
      doc.text("Ready to transform your business with AI? Let's discuss the next steps.", 20, currentY);
      
      currentY += 10;
      doc.text("Best regards,", 20, currentY);
      currentY += 7;
      doc.text("The ChatSites.ai Team", 20, currentY);

      // Save the PDF
      doc.save(`${lead.company_name}-AI-Proposal.pdf`);

      // Mark proposal as sent
      await handleMarkProposalSent(lead.id);
      
      toast({
        title: "Success",
        description: "Proposal generated and downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to generate proposal",
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
        
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Add Admin User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter admin email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddAdmin}>Add Admin</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
      
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
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSendProposal(lead)}
                        >
                          Send Proposal
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkProposalSent(lead.id)}
                        >
                          Mark Sent
                        </Button>
                      </>
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
