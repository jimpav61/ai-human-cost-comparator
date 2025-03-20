
import { Lead } from "@/types/leads";
import { getSafeFileName } from "../report-generator/fileNameUtils";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { toast } from "@/hooks/use-toast";

export const saveProposalPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  try {
    const safeCompanyName = getSafeFileName(lead);
    const fileName = `${safeCompanyName}-Proposal.pdf`;
    
    console.log("Proposal document generated, saving as:", fileName);
    console.log("Lead information:", {
      id: lead.id,
      companyName: lead.company_name,
      aiTier: lead.calculator_inputs?.aiTier || lead.calculator_results?.tierKey,
      aiType: lead.calculator_inputs?.aiType || lead.calculator_results?.aiType,
      callVolume: lead.calculator_inputs?.callVolume || lead.calculator_results?.additionalVoiceMinutes || 0
    });
    
    // Save the document with proper company name
    doc.save(fileName);
    
    // Log successful download for debugging
    console.log("✅ Proposal document downloaded successfully");
    
    toast({
      title: "Success",
      description: "Proposal generated and downloaded successfully",
      duration: 1500,
    });
  } catch (error) {
    console.error("Error saving proposal document:", error);
    
    // Log detailed error for debugging
    console.error("Detailed error information:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      lead: lead.id
    });
    
    toast({
      title: "Error",
      description: `Failed to save proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
      duration: 1500,
    });
  }
};
