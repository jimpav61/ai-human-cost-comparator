
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";

/**
 * Verify if a report exists in storage for a specific lead
 * @param lead Lead to check for report
 * @returns Promise with URL if found, null if not found
 */
export async function verifyLeadReportStorage(lead: Lead): Promise<string | null> {
  if (!lead || !lead.id) {
    console.error("Cannot verify report: Invalid lead or missing ID");
    return null;
  }
  
  try {
    console.log("Checking for existing report in storage for lead:", lead.id);
    
    // Standard filename format based on UUID
    const fileName = `${lead.id}.pdf`;
    
    // First check if bucket is accessible
    const { data: bucketTest, error: bucketError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.error("Cannot access reports bucket:", bucketError);
      return null;
    }
    
    // Look for the specific file
    const { data: files, error: listError } = await supabase.storage
      .from('reports')
      .list('', { 
        search: fileName 
      });
    
    if (listError) {
      console.error("Error listing files in reports bucket:", listError);
      return null;
    }
    
    // Check if file exists
    const reportFile = files?.find(file => file.name === fileName);
    
    if (!reportFile) {
      console.log("No report found for lead:", lead.id);
      return null;
    }
    
    console.log("Found existing report file:", reportFile.name);
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
    
    return urlData?.publicUrl || null;
  } catch (error) {
    console.error("Error in verifyLeadReportStorage:", error);
    return null;
  }
}
