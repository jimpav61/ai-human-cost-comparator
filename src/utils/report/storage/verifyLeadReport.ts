
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
    
    // CRITICAL FIX: Focus exclusively on UUID as the file identifier
    // The only valid filename is {leadId}.pdf - this is the standard we enforce
    const uuidBasedFileName = `${lead.id}.pdf`;
    console.log("Looking for file with exact name:", uuidBasedFileName);
    
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
    
    // CRITICAL FIX: Check for exact UUID match first as the primary method
    const exactUuidMatch = fileList?.find(file => file.name === uuidBasedFileName);
    
    if (exactUuidMatch) {
      console.log("✅ Found exact UUID match:", exactUuidMatch.name);
      
      // Get the public URL for this file to verify it's accessible
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(exactUuidMatch.name);
      
      console.log("Public URL for exact UUID match:", urlData?.publicUrl);
      
      return {
        exists: true,
        fileList: fileList || [],
        matchingFiles: [exactUuidMatch],
        error: null,
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    // Secondary check: look for any file that starts with the UUID
    // This is fallback for any legacy files
    const uuidPrefixMatches = fileList?.filter(file => 
      file.name.startsWith(`${lead.id}.`) || 
      file.name.startsWith(`${lead.id}_`)
    ) || [];
    
    if (uuidPrefixMatches.length > 0) {
      console.log("Found", uuidPrefixMatches.length, "files with UUID prefix:", lead.id);
      console.log("Matching files:", uuidPrefixMatches.map(f => f.name).join(', '));
      
      // Get the public URLs for these files to verify they're accessible
      const urls = await Promise.all(uuidPrefixMatches.map(async (file) => {
        const { data } = await supabase.storage
          .from('reports')
          .getPublicUrl(file.name);
        return {
          filename: file.name,
          url: data?.publicUrl
        };
      }));
      
      console.log("Public URLs for UUID prefix matches:", urls);
      
      return {
        exists: true,
        fileList: fileList || [],
        matchingFiles: uuidPrefixMatches,
        error: null,
        leadId: lead.id || 'unknown',
        companyName: lead.company_name || 'unknown'
      };
    }
    
    // No matching files found with UUID-based naming
    console.log("❌ No files found for lead UUID:", lead.id);
    
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
