
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
import { Download, FileDown, Phone, Globe } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string | null;
  website: string | null;
  calculator_inputs: any;
  calculator_results: any;
  proposal_sent: boolean;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          window.location.href = '/';
          return;
        }

        const { data: adminCheck, error: adminError } = await supabase
          .from('allowed_admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (adminError || !adminCheck) {
          await supabase.auth.signOut();
          window.location.href = '/';
          return;
        }

        // Fetch leads after authentication is confirmed
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        setLeads(leadsData || []);
        setLoading(false);

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the dashboard",
          variant: "destructive",
        });
        window.location.href = '/';
      }
    };

    checkAuth();

    const authListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = '/';
      }
    });

    return () => {
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

  const handleDownloadReport = async (lead: Lead) => {
    try {
      // For now, just show a toast - we'll implement the actual download later
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
      // For now, just show a toast - we'll implement the proposal generation later
      toast({
        title: "Generating Proposal",
        description: `Generating proposal for ${lead.company_name}...`,
      });
    } catch (error) {
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
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

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
                    <div>{lead.email}</div>
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
    </div>
  );
};

export default AdminDashboard;
