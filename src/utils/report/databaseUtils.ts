
import { supabase } from "@/integrations/supabase/client";
import { ReportData } from "./types";
import { Lead } from "@/types/leads";
import { v4 as uuidv4 } from 'uuid';
import { toJson } from "@/hooks/calculator/supabase-types";

/**
 * Check if the user is authenticated
 */
export async function checkUserAuthentication(): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    console.error("Authentication error:", error);
    return false;
  }
  return true;
}

/**
 * Save report data to the database
 */
export async function saveReportData(
  lead: Lead,
  pdfUrl: string,
  version: number = 1
): Promise<string | null> {
  try {
    console.log("Saving report data for lead:", lead.id);
    
    // First, check if the lead exists in the database
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', lead.id)
      .single();
    
    if (checkError || !existingLead) {
      console.log("Lead not found in database, attempting to insert first");
      
      // Insert the lead first
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          id: lead.id,
          name: lead.name,
          company_name: lead.company_name,
          email: lead.email,
          phone_number: lead.phone_number,
          website: lead.website,
          industry: lead.industry,
          employee_count: lead.employee_count,
          calculator_inputs: toJson(lead.calculator_inputs),
          calculator_results: toJson(lead.calculator_results),
          proposal_sent: lead.proposal_sent || false,
          created_at: lead.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error("Error inserting lead:", insertError);
        throw insertError;
      }
      
      console.log("Successfully inserted lead");
    }
    
    // Generate a unique report ID
    const reportId = uuidv4();
    
    // Insert the report data
    const { data, error } = await supabase
      .from('proposal_revisions')
      .insert({
        id: reportId,
        lead_id: lead.id,
        proposal_content: JSON.stringify({
          company_name: lead.company_name,
          contact_name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number,
          calculator_inputs: lead.calculator_inputs,
          calculator_results: lead.calculator_results,
          pdf_url: pdfUrl
        }),
        title: `${lead.company_name} Report`,
        version_number: version,
        is_sent: false
      });
    
    if (error) {
      console.error("Error saving report data:", error);
      throw error;
    }
    
    console.log("Report data saved successfully, ID:", reportId);
    return reportId;
  } catch (error) {
    console.error("Error in saveReportData:", error);
    return null;
  }
}
