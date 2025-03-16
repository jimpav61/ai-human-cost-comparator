
// Re-export utility functions from modular files
export { verifyReportsBucket, testStorageBucketConnectivity } from './bucketUtils';
export { saveReportData, checkUserAuthentication } from './databaseUtils';
export { savePDFToStorage } from './fileUtils';
export { saveReportToStorageWithRetry } from './retryUtils';

import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";

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

/**
 * Fix common storage issues for reports
 */
export async function fixReportStorageIssues(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  try {
    console.log("Checking report storage accessibility...");
    
    // 1. Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError || !authData.session) {
      return {
        success: false,
        message: "Authentication check failed. Please log in again.",
        details: { authError }
      };
    }
    
    // 2. Test if we can list files in the bucket (permission check)
    const { data: filesList, error: filesError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
      
    if (filesError) {
      console.error("Cannot access reports bucket:", filesError);
      return {
        success: false,
        message: "Cannot access files in reports bucket. You may not have the required permissions.",
        details: { filesError }
      };
    }
    
    console.log("Successfully listed files in reports bucket:", filesList);
    
    // 3. Test upload permission with a sample file
    const testBlob = new Blob(["test file content"], { type: "text/plain" });
    const testFileName = `storage_test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(testFileName, testBlob, {
        contentType: 'text/plain',
        upsert: true
      });
    
    if (uploadError) {
      console.error("Test upload failed:", uploadError);
      return {
        success: false,
        message: "Cannot upload files to reports bucket. Permission or configuration issue.",
        details: { uploadError }
      };
    }
    
    console.log("Test upload succeeded:", uploadData);
    
    // 4. Verify public access to the test file
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(testFileName);
    
    if (!urlData?.publicUrl) {
      console.error("Could not get public URL for test file");
      return {
        success: false,
        message: "Could not generate public URL for test file. Bucket might not be configured as public.",
        details: { urlData }
      };
    }
    
    // Try to fetch the file to verify it's publicly accessible
    try {
      const response = await fetch(urlData.publicUrl);
      console.log("Public URL access result:", response.status, response.statusText);
      
      if (!response.ok) {
        return {
          success: false,
          message: `Public URL not accessible (Status: ${response.status}). Bucket might not be publicly accessible.`,
          details: { url: urlData.publicUrl, status: response.status }
        };
      }
    } catch (fetchError) {
      console.error("Failed to access public URL:", fetchError);
    }
    
    // 5. Clean up the test file
    await supabase.storage
      .from('reports')
      .remove([testFileName]);
    
    return {
      success: true,
      message: "Report storage is functioning correctly. Permissions and access verified.",
      details: {
        uploadWorks: true,
        publicUrlWorks: true
      }
    };
  } catch (error) {
    console.error("Error in fixReportStorageIssues:", error);
    return {
      success: false,
      message: "Error checking storage access. See console for details.",
      details: { error }
    };
  }
}
