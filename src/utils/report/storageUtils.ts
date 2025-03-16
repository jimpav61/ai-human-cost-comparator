
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
    
    // Get company name for pattern matching
    const safeCompanyName = lead.company_name?.replace(/[^a-zA-Z0-9.-]/g, '_') || '';
    
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
    
    // Filter files that might be related to this lead
    // This is approximate since we add timestamps to filenames
    const matchingFiles = fileList?.filter(file => {
      return file.name.includes(safeCompanyName);
    }) || [];
    
    console.log("Found", matchingFiles.length, "potential matching files for company:", safeCompanyName);
    
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
    console.log("Attempting to fix common report storage issues...");
    
    // 1. Verify authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError || !authData.session) {
      return {
        success: false,
        message: "Authentication check failed. Please log in again.",
        details: { authError }
      };
    }
    
    // 2. Verify the reports bucket exists (without creating it)
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Could not list buckets:", bucketsError);
      return {
        success: false,
        message: "Could not access storage buckets. Check network connection and permissions.",
        details: { bucketsError }
      };
    }
    
    // Check if reports bucket exists
    const reportsBucket = buckets?.find(b => b.name === 'reports');
    console.log("Reports bucket found?", !!reportsBucket);
    
    if (!reportsBucket) {
      // Just report that it's missing without trying to create it
      console.error("Reports bucket not found in storage");
      return {
        success: false,
        message: "Reports bucket not found in Supabase storage. This is a configuration issue.",
        details: { existingBuckets: buckets?.map(b => b.name) }
      };
    }
    
    console.log("Reports bucket exists:", reportsBucket);
    
    // 3. Test if we can list files in the bucket (permission check)
    const { data: filesList, error: filesError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
      
    if (filesError) {
      console.error("Cannot list files in reports bucket:", filesError);
      return {
        success: false,
        message: "Cannot access files in reports bucket. You may not have the required permissions.",
        details: { filesError }
      };
    }
    
    console.log("Successfully listed files in reports bucket:", filesList);
    
    // 4. Test upload permission with a sample file
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
    
    // 5. Verify public access to the test file
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
    
    // 6. Clean up the test file
    await supabase.storage
      .from('reports')
      .remove([testFileName]);
    
    return {
      success: true,
      message: "Report storage is functioning correctly. Permissions and access verified.",
      details: {
        bucketExists: true,
        uploadWorks: true,
        publicUrlWorks: true
      }
    };
  } catch (error) {
    console.error("Error in fixReportStorageIssues:", error);
    return {
      success: false,
      message: "Error fixing storage issues. See console for details.",
      details: { error }
    };
  }
}
