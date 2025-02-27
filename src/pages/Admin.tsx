
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
import { formatCurrency, formatPercent } from '@/utils/formatters';

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
        window.location.href = '/';
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
        window.location.href = '/';
      }
    };

    checkAccess();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const generateReportPDF = (lead: Lead) => {
    // Basic report for quick overview
    const leadData: LeadData = {
      name: lead.name,
      companyName: lead.company_name,
      email: lead.email,
      phoneNumber: lead.phone_number || ''
    };

    return generatePDF({
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
          title: "Cost Savings",
          description: "Potential annual savings based on your inputs."
        }
      ],
      aiPlacements: [
        {
          role: "Customer Service",
          capabilities: [
            "Handle routine inquiries",
            "Route complex issues to humans",
            "24/7 availability"
          ]
        }
      ]
    });
  };

  const generateProposalPDF = (lead: Lead) => {
    const leadData: LeadData = {
      name: lead.name,
      companyName: lead.company_name,
      email: lead.email,
      phoneNumber: lead.phone_number || ''
    };

    return generatePDF({
      contactInfo: leadData.name,
      companyName: leadData.companyName,
      email: leadData.email,
      phoneNumber: leadData.phoneNumber,
      results: lead.calculator_results,
      businessSuggestions: [
        {
          title: "Comprehensive AI Integration Strategy",
          description: "A tailored approach to revolutionize your customer service operations through strategic AI implementation."
        },
        {
          title: "Phase 1: Initial Setup (Weeks 1-2)",
          description: "Implementation of basic AI chatbot capabilities, team training, and initial configuration of voice AI systems."
        },
        {
          title: "Phase 2: Advanced Integration (Weeks 3-4)",
          description: "Deployment of advanced AI features, custom knowledge base development, and integration with existing systems."
        },
        {
          title: "Phase 3: Optimization (Weeks 5-6)",
          description: "Fine-tuning AI responses, implementing feedback loops, and optimizing performance metrics."
        },
        {
          title: "Expected Outcomes",
          description: `Based on your inputs, we project ${formatPercent(lead.calculator_results.savingsPercentage)} cost reduction and significant improvement in customer satisfaction.`
        }
      ],
      aiPlacements: [
        {
          role: "Customer Service Transformation",
          capabilities: [
            "AI-powered 24/7 customer support system",
            "Intelligent routing and escalation protocols",
            "Real-time analytics and performance monitoring",
            "Custom knowledge base integration"
          ]
        },
        {
          role: "Implementation Strategy",
          capabilities: [
            "Dedicated implementation team",
            "Comprehensive staff training program",
            "Regular performance reviews and adjustments",
            "Ongoing technical support and maintenance"
          ]
        },
        {
          role: "Technical Integration",
          capabilities: [
            "Seamless integration with existing systems",
            "Custom API development for specific needs",
            "Scalable infrastructure setup",
            "Security and compliance measures"
          ]
        },
        {
          role: "ROI Maximization",
          capabilities: [
            `Projected monthly savings: ${formatCurrency(lead.calculator_results.monthlySavings)}`,
            `Projected annual savings: ${formatCurrency(lead.calculator_results.yearlySavings)}`,
            "Continuous optimization for maximum efficiency",
            "Regular ROI assessment and reporting"
          ]
        }
      ]
    });
  };

  const handleDownloadReport = (lead: Lead) => {
    try {
      const doc = generateReportPDF(lead);
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
      // Generate and download the more detailed proposal PDF
      const doc = generateProposalPDF(lead);
      doc.save(`${lead.company_name}-AI-Integration-Proposal.pdf`);

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
        description: "Detailed proposal downloaded and status updated",
      });
    } catch (error) {
      console.error('Error with proposal:', error);
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
