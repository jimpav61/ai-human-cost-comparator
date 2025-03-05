
import { Lead } from "@/types/leads";
import { getSafeFileName } from "../report-generator/saveReport";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { toast } from "@/hooks/use-toast";

export const saveProposalPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  try {
    const safeCompanyName = getSafeFileName(lead);
    
    console.log("Document generated, saving as:", `${safeCompanyName}-Proposal.pdf`);
    
    // Save the document with proper company name
    doc.save(`${safeCompanyName}-Proposal.pdf`);
    
    toast({
      title: "Success",
      description: "Proposal generated and downloaded successfully",
    });
  } catch (error) {
    console.error("Error saving proposal document:", error);
    toast({
      title: "Error",
      description: `Failed to save proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
  }
};
