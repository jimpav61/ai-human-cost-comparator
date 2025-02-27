
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
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
import type { BusinessSuggestion, AIPlacement } from '@/components/calculator/types';

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
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleDownloadReport = (lead: Lead) => {
    try {
      const businessSuggestions: BusinessSuggestion[] = [
        {
          title: "24/7 Customer Support",
          description: "Implement AI to provide round-the-clock support without increasing staff costs."
        },
        {
          title: "Cost-Effective Scaling",
          description: "Scale your operations efficiently with AI automation."
        }
      ];

      const aiPlacements: AIPlacement[] = [
        {
          role: "Front-line Support",
          capabilities: [
            "Handle routine customer inquiries instantly",
            "Route complex issues to human agents",
            "Available 24/7 without additional cost"
          ]
        }
      ];

      const doc = generatePDF({
        contactInfo: lead.name,
        companyName: lead.company_name,
        email: lead.email,
        phoneNumber: lead.phone_number,
        results: lead.calculator_results,
        businessSuggestions,
        aiPlacements,
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
      const { error } = await supabase
        .from('leads')
        .update({ proposal_sent: true })
        .eq('id', lead.id);

      if (error) throw error;

      setLeads(leads.map(l => 
        l.id === lead.id ? { ...l, proposal_sent: true } : l
      ));

      toast({
        title: "Success",
        description: "Proposal marked as sent",
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update proposal status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      try {
        console.log("Admin: Checking session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Admin: Session error:", sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log("Admin: No session found");
          window.location.href = '/';
          return;
        }

        console.log("Admin: Session found, checking admin status");

        const { data: adminCheck, error: adminError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (adminError) {
          console.error("Admin: Admin check error:", adminError);
          throw adminError;
        }

        if (!adminCheck) {
          console.log("Admin: Not an admin");
          await supabase.auth.signOut();
          window.location.href = '/';
          return;
        }

        console.log("Admin: Admin verified, fetching leads");

        if (isSubscribed) {
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

          if (leadsError) {
            console.error("Admin: Leads fetch error:", leadsError);
            throw leadsError;
          }
          
          if (isSubscribed) {
            setLeads(leadsData || []);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Admin: Auth check error:', error);
        if (isSubscribed) {
          toast({
            title: "Error",
            description: "An error occurred while checking authentication",
            variant: "destructive",
          });
          window.location.href = '/';
        }
      }
    };

    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Admin: Auth state changed:", event);
      if (event === 'SIGNED_OUT') {
        window.location.href = '/';
      } else if (event === 'SIGNED_IN' && isSubscribed) {
        checkAuth();
      }
    });

    return () => {
      isSubscribed = false;
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
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
