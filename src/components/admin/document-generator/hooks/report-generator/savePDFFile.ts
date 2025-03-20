
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { Lead } from "@/types/leads";
import { getReportFileName } from "./fileNameUtils";

/**
 * Saves the generated PDF document to the user's device
 */
export const saveReportPDF = (doc: JsPDFWithAutoTable, lead: Lead): void => {
  const fileName = getReportFileName(lead);
  
  // Enhanced logging to debug voice minutes issue
  console.log("Document generated, saving as:", fileName);
  console.log("Lead tier and voice data:", {
    inputs: {
      aiTier: lead.calculator_inputs?.aiTier,
      aiType: lead.calculator_inputs?.aiType,
      callVolume: lead.calculator_inputs?.callVolume
    },
    results: {
      tierKey: lead.calculator_results?.tierKey,
      aiType: lead.calculator_results?.aiType,
      additionalVoiceMinutes: lead.calculator_results?.additionalVoiceMinutes,
      basePriceMonthly: lead.calculator_results?.basePriceMonthly,
      aiCostMonthly: lead.calculator_results?.aiCostMonthly
    }
  });
  
  // Save the document with proper company name
  doc.save(fileName);
  
  // Log successful download
  console.log(`✅ Report PDF for ${lead.company_name} saved successfully as "${fileName}"`);
  
  // Redirect to workshop page if we're in the front-end context (not admin)
  // We can detect this by checking if we're not in the /admin route
  if (!window.location.pathname.includes('/admin')) {
    const tierName = lead.calculator_results?.tierKey || lead.calculator_inputs?.aiTier || 'Standard';
    const aiType = lead.calculator_results?.aiType || lead.calculator_inputs?.aiType || 'Chat Only';
    
    // Create lead data for workshop
    const leadData = {
      id: lead.id,
      name: lead.name,
      companyName: lead.company_name,
      email: lead.email,
      phoneNumber: lead.phone_number,
      website: lead.website,
      industry: lead.industry,
      employeeCount: lead.employee_count
    };
    
    // Navigate to workshop page
    window.setTimeout(() => {
      window.location.href = `/workshop?id=${lead.id}#workshop`;
      
      // If using react-router v6 history API isn't accessible directly,
      // we need to use window.location with state in URL parameters
      // and then redirect with the state data in the query
    }, 500); // Small delay to ensure the download starts first
  }
};
