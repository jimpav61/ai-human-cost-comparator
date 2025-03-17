
import { supabase } from "@/integrations/supabase/client";

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
    
    console.log("User authenticated with ID:", authData.session.user.id);
    
    // 2. Test if we can list files in the bucket (permission check)
    const { data: filesList, error: filesError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
      
    if (filesError) {
      console.error("Cannot access reports bucket:", filesError);
      
      // Special handling for bucket not found
      if (filesError.message.includes("not found") || filesError.message.includes("exist")) {
        return {
          success: false,
          message: "Reports bucket doesn't exist. It needs to be created by an administrator.",
          details: { filesError }
        };
      } else if (filesError.message.includes("Permission denied")) {
        return {
          success: false,
          message: "Permission denied. You don't have access to the reports bucket.",
          details: { filesError }
        };
      }
      
      return {
        success: false,
        message: "Cannot access files in reports bucket: " + filesError.message,
        details: { filesError }
      };
    }
    
    console.log("Successfully listed files in reports bucket:", filesList?.length || 0, "files");
    
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
      
      if (uploadError.message.includes("Permission denied")) {
        return {
          success: false,
          message: "Write permission denied. You can view files but not add new ones.",
          details: { uploadError }
        };
      }
      
      return {
        success: false,
        message: "Cannot upload files to reports bucket: " + uploadError.message,
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
      
      // Clean up the test file
      await supabase.storage.from('reports').remove([testFileName]);
      
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
        // Clean up the test file
        await supabase.storage.from('reports').remove([testFileName]);
        
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
      message: "Report storage is functioning correctly. Authentication, permissions, and public access verified.",
      details: {
        uploadWorks: true,
        publicUrlWorks: true,
        fileCount: filesList?.length || 0
      }
    };
  } catch (error) {
    console.error("Error in fixReportStorageIssues:", error);
    return {
      success: false,
      message: "Error checking storage access: " + (error instanceof Error ? error.message : String(error)),
      details: { error }
    };
  }
}
