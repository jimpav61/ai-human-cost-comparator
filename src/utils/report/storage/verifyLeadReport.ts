
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
    
    // CRITICAL FIX: Look for files by lead ID instead of company name
    // The expected primary filename should be {leadId}.pdf
    const primaryFileName = `${lead.id}.pdf`;
    
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
    
    // Filter files specifically by lead ID
    const matchingFiles = fileList?.filter(file => {
      return file.name === primaryFileName || file.name.startsWith(`${lead.id}_`);
    }) || [];
    
    console.log("Found", matchingFiles.length, "matching files for lead ID:", lead.id);
    
    if (matchingFiles.length > 0) {
      console.log("Matching files:", matchingFiles);
      
      // Get the public URLs for these files to verify they're accessible
      const urls = await Promise.all(matchingFiles.map(async (file) => {
        const { data } = await supabase.storage
          .from('reports')
          .getPublicUrl(file.name);
        return {
          filename: file.name,
          url: data?.publicUrl
        };
      }));
      
      console.log("Public URLs for matching files:", urls);
    }
    
    return {
      exists: matchingFiles.length > 0,
      fileList: fileList || [],
      matchingFiles,
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
