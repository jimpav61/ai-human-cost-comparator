
import { generatePDF } from "@/components/calculator/pdf";
import { Lead } from "@/types/leads";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";
import { toast } from "@/hooks/use-toast";

/**
 * Shared utility function that generates and downloads a PDF report
 * for a lead using the same generator regardless of whether it's called
 * from the frontend or admin panel
 */
export const generateAndDownloadReport = (lead: Lead) => {
  try {
    console.log('[SHARED REPORT] Generating report for lead:', lead);
    
    // Check if lead exists and has calculator results
    if (!lead) {
      throw new Error("Lead data is missing");
    }

    // Use the saved calculator inputs and results directly
    if (!lead.calculator_results || Object.keys(lead.calculator_results).length === 0) {
      throw new Error("This lead has no saved calculation results");
    }
    
    // Extract all data from calculator inputs, using saved values only, no recalculation
    const aiTier = lead.calculator_inputs?.aiTier || 'growth';
    const aiType = lead.calculator_inputs?.aiType || 'chatbot';
    
    // Format tier and AI type display names
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                    
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                          aiType === 'voice' ? 'Basic Voice' : 
                          aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                          aiType === 'both' ? 'Text & Basic Voice' : 
                          aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
    
    // Generate the PDF exactly as it was saved - no recalculation
    const doc = generatePDF({
      contactInfo: lead.name || 'Valued Client',
      companyName: lead.company_name || 'Your Company',
      email: lead.email || 'client@example.com',
      phoneNumber: lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: lead.calculator_results,
      additionalVoiceMinutes: lead.calculator_inputs?.callVolume || 0,
      includedVoiceMinutes: aiTier === 'starter' ? 0 : 600,
      businessSuggestions: [
        {
          title: "Automate Common Customer Inquiries",
          description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
        },
        {
          title: "Enhance After-Hours Support",
          description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
        },
        {
          title: "Streamline Onboarding Process",
          description: "Use AI assistants to guide new customers through product setup and initial questions."
        }
      ],
      aiPlacements: [
        {
          role: "Front-line Customer Support",
          capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
        },
        {
          role: "Technical Troubleshooting",
          capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
        },
        {
          role: "Sales Assistant",
          capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
        }
      ],
      tierName: tierName,
      aiType: aiTypeDisplay
    });
    
    // Save file with proper naming
    const safeCompanyName = getSafeFileName(lead);
    doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: `Report for ${lead.company_name || 'Client'} downloaded successfully`,
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error('[SHARED REPORT] Report generation error:', error);
    toast({
      title: "Error",
      description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return false;
  }
};
