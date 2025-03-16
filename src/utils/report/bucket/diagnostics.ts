
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
      };
    }
    
    const isAuthenticated = !!authData.session;
    const userId = isAuthenticated ? authData.session.user.id : null;
    
    console.log("STORAGE DIAGNOSTIC: User authenticated:", isAuthenticated, "User ID:", userId);
    
    // First check which buckets are available
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
        
        // Check if reports bucket exists
        const reportsBucketExists = bucketsList.some(bucket => bucket.name === 'reports');
        console.log("STORAGE DIAGNOSTIC: Reports bucket exists:", reportsBucketExists);
        
        // REMOVED: No longer attempting to create bucket here
      }
    } catch (bucketsCheckError) {
      console.error("STORAGE DIAGNOSTIC: Unexpected error listing buckets:", bucketsCheckError);
      bucketsError = bucketsCheckError;
    }
    
    // Directly test if we can access the reports bucket
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    
    if (reportsError) {
      console.error("STORAGE DIAGNOSTIC: Reports bucket access error:", reportsError);
    }
    
    // Only test upload if we can access the bucket
    let uploadPermissionTest = { success: false, error: null };
    
    if (reportsAccessible && isAuthenticated) {
      const testBlob = new Blob(["test"], { type: "text/plain" });
      const testPath = `permission_test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(testPath, testBlob, {
          upsert: true
        });
      
      if (uploadError) {
        console.error("STORAGE DIAGNOSTIC: Upload permission test failed:", uploadError);
        uploadPermissionTest = { success: false, error: uploadError };
      } else {
        console.log("STORAGE DIAGNOSTIC: Upload permission test succeeded");
        uploadPermissionTest = { success: true, error: null };
        
        // Clean up test file
        await supabase.storage.from('reports').remove([testPath]);
      }
    }
    
    return {
      success: reportsAccessible,
      storageAccessible: true,
      bucketAccessible: reportsAccessible,
      bucketExists: reportsAccessible,
      bucketList: reportsAccessible ? ['reports'] : [],
      authStatus: isAuthenticated,
      userId: userId,
      error: reportsError,
      uploadPermissionTest,
      availableBuckets: bucketsList.map(b => b.name),
      bucketsError
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
    };
  }
}
