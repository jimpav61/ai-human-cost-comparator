
import { supabase } from "@/integrations/supabase/client";

/**
 * Test connectivity to the storage bucket and diagnose issues
 * @returns Object with diagnostic information
 */
export async function testStorageBucketConnectivity() {
  try {
    console.log("BUCKET TEST: Starting comprehensive storage diagnostic");
    
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("STORAGE DIAGNOSTIC: Authentication error:", authError.message);
      return {
        success: false,
        storageAccessible: false,
        bucketAccessible: false,
        bucketExists: false,
        bucketList: [],
        authStatus: false,
        authError: authError,
        error: "Authentication error",
        message: "Authentication error: " + authError.message
      };
    }
    
    const isAuthenticated = !!authData.session;
    const userId = isAuthenticated ? authData.session.user.id : null;
    
    console.log("STORAGE DIAGNOSTIC: User authenticated:", isAuthenticated, "User ID:", userId);
    
    if (!isAuthenticated) {
      return {
        success: false,
        storageAccessible: false,
        bucketAccessible: false,
        bucketExists: false,
        bucketList: [],
        authStatus: false,
        error: new Error("Not authenticated"),
        message: "User is not authenticated. Sign in to access storage."
      };
    }
    
    // Direct test for reports bucket with minimal request
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 10 });
    
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    
    if (reportsError) {
      console.error("STORAGE DIAGNOSTIC: Reports bucket access error:", reportsError);
      
      // Get available buckets for diagnostic purposes
      let bucketsList = [];
      let bucketsError = null;
      
      try {
        const { data: availableBuckets, error: listBucketsError } = await supabase.storage.listBuckets();
        
        if (listBucketsError) {
          console.error("STORAGE DIAGNOSTIC: Error listing buckets:", listBucketsError);
          bucketsError = listBucketsError;
        } else {
          bucketsList = availableBuckets || [];
          console.log("STORAGE DIAGNOSTIC: Available buckets:", bucketsList.map(b => b.name).join(', '));
        }
      } catch (bucketsCheckError) {
        console.error("STORAGE DIAGNOSTIC: Unexpected error listing buckets:", bucketsCheckError);
        bucketsError = bucketsCheckError;
      }
      
      // Provide detailed error information
      let errorMessage = "Cannot access reports bucket. ";
      
      if (reportsError.message.includes("Permission denied")) {
        errorMessage += "Permission denied - check your user roles and bucket policies.";
      } else if (reportsError.message.includes("not found") || reportsError.message.includes("exist")) {
        errorMessage += "Bucket not found - it may need to be created.";
      } else {
        errorMessage += reportsError.message;
      }
      
      return {
        success: false,
        storageAccessible: true,
        bucketAccessible: false,
        bucketExists: false,
        authStatus: isAuthenticated,
        userId: userId,
        error: reportsError,
        availableBuckets: bucketsList.map(b => b.name),
        bucketsError,
        message: errorMessage
      };
    }
    
    console.log("STORAGE DIAGNOSTIC: Found files in reports bucket:", reportsList?.length || 0);
    if (reportsList && reportsList.length > 0) {
      console.log("STORAGE DIAGNOSTIC: Sample files:", reportsList.slice(0, 3).map(f => f.name).join(', '));
    }
    
    // Perform a test upload and delete to confirm write permissions
    let uploadPermissionTest = { success: false, error: null, message: "" };
    
    try {
      const testBlob = new Blob(["test"], { type: "text/plain" });
      const testPath = `permission_test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(testPath, testBlob, {
          upsert: true
        });
      
      if (uploadError) {
        console.error("STORAGE DIAGNOSTIC: Upload permission test failed:", uploadError);
        uploadPermissionTest = { 
          success: false, 
          error: uploadError,
          message: "Upload test failed: " + uploadError.message 
        };
      } else {
        console.log("STORAGE DIAGNOSTIC: Upload permission test succeeded");
        uploadPermissionTest = { 
          success: true, 
          error: null,
          message: "Upload test succeeded" 
        };
        
        // Clean up test file
        await supabase.storage.from('reports').remove([testPath]);
      }
    } catch (uploadTestError) {
      console.error("STORAGE DIAGNOSTIC: Unexpected error in upload test:", uploadTestError);
      uploadPermissionTest = { 
        success: false, 
        error: uploadTestError,
        message: "Upload test error: " + (uploadTestError instanceof Error ? uploadTestError.message : String(uploadTestError))
      };
    }
    
    return {
      success: reportsAccessible && uploadPermissionTest.success,
      storageAccessible: true,
      bucketAccessible: reportsAccessible,
      bucketExists: reportsAccessible,
      bucketList: reportsAccessible ? ['reports'] : [],
      authStatus: isAuthenticated,
      userId: userId,
      uploadPermissionTest,
      availableBuckets: ['reports'],
      bucketsError: null,
      fileCount: reportsList?.length || 0,
      fileNames: reportsList?.slice(0, 5).map(f => f.name) || [],
      message: uploadPermissionTest.success 
        ? "Storage bucket accessible and writable." 
        : "Storage bucket accessible but write permission issue: " + uploadPermissionTest.message
    };
  } catch (error) {
    console.error("STORAGE DIAGNOSTIC: Unexpected error:", error);
    return {
      success: false,
      storageAccessible: false,
      bucketAccessible: false,
      bucketExists: false,
      bucketList: [],
      authStatus: false,
      error,
      message: "Unexpected error in storage diagnostic: " + (error instanceof Error ? error.message : String(error))
    };
  }
}
