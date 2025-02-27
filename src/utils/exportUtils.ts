
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

/**
 * Export leads data to a CSV file
 * @param leads Array of lead objects
 */
export const exportLeadsToCSV = (leads: Lead[]): void => {
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
