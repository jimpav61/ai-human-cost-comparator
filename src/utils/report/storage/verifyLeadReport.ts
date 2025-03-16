
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";

/**
 * Verify if a specific lead's report exists in storage
 * @param lead The lead to check for
 * @returns Object with information about the report's storage status
 */
export async function verifyLeadReportStorage(lead: Lead): Promise<{
  exists: boolean;
  fileList: any[];
  matchingFiles: any[];
  error: any | null;
  leadId: string;
  companyName: string;
}> {
  try {
    console.log("Verifying storage for lead report:", lead.id, lead.company_name);
    
    // First check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Authentication error during report verification:", authError.message);
      return {
        exists: false,
        fileList: [],
        matchingFiles: [],
        error: authError,
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    if (!authData.session) {
      console.error("User is not authenticated, cannot verify storage");
      return {
        exists: false, 
        fileList: [],
        matchingFiles: [],
        error: new Error("User not authenticated"),
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    // ONLY look for the standardized UUID-based filename format
    const standardFileName = `${lead.id}.pdf`;
    console.log("Looking for file with exact standardized name:", standardFileName);
    
    // List all files in the reports bucket
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });
    
    if (listError) {
      console.error("Error listing files in reports bucket:", listError);
      return {
        exists: false,
        fileList: [],
        matchingFiles: [],
        error: listError,
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    console.log("Found", fileList?.length || 0, "files in reports bucket");
    
    // Check ONLY for the exact UUID match - no secondary checks or fallbacks
    const exactMatch = fileList?.find(file => file.name === standardFileName);
    
    if (exactMatch) {
      console.log("✅ Found exact UUID match:", exactMatch.name);
      
      // Get the public URL for this file to verify it's accessible
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(exactMatch.name);
      
      console.log("Public URL for exact UUID match:", urlData?.publicUrl);
      
      return {
        exists: true,
        fileList: fileList || [],
        matchingFiles: [exactMatch],
        error: null,
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    // No matching file found with strict UUID-based naming
    console.log("❌ No files found for lead UUID format:", standardFileName);
    
    return {
      exists: false,
      fileList: fileList || [],
      matchingFiles: [],
      error: null,
      leadId: lead.id || 'unknown',
      companyName: lead.company_name || 'unknown'
    };
  } catch (error) {
    console.error("Error in verifyLeadReportStorage:", error);
    return {
      exists: false,
      fileList: [],
      matchingFiles: [],
      error,
      leadId: lead.id || 'unknown',
      companyName: lead.company_name || 'unknown'
    };
  }
}
