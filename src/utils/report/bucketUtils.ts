
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket existence...");
    
    // Check authentication first
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Authentication error:", authError.message);
      return false;
    }
    
    const isAuthenticated = !!authData.session;
    
    if (!isAuthenticated) {
      console.error("User is not authenticated, cannot verify bucket");
      return false;
    }
    
    console.log("User authenticated with ID:", authData.session.user.id);
    
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      
      // Try explicit check for the reports bucket as fallback
      const { data: reportsList, error: reportsError } = await supabase.storage
        .from('reports')
        .list('', { limit: 1 });
        
      if (!reportsError) {
        console.log("Reports bucket exists based on list attempt");
        return true;
      }
      
      console.error("Failed to access reports bucket in fallback check:", reportsError);
      return false;
    }
    
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("Reports bucket exists:", reportsBucketExists);
    
    if (reportsBucketExists) {
      console.log("Reports bucket already exists, no need to create it");
      
      // Even if bucket exists, test permission by listing
      const { error: accessError } = await supabase.storage
        .from('reports')
        .list('', { limit: 1 });
      
      if (accessError) {
        console.error("Bucket exists but cannot access it:", accessError);
        toast({
          title: "Storage Permission Issue",
          description: "You don't have permission to access the reports bucket. Please check your user permissions.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    }
    
    console.error("Reports bucket does not exist in this Supabase project");
    toast({
      title: "Storage Configuration Issue",
      description: "Reports bucket not found. Please check Supabase storage configuration.",
      variant: "destructive"
    });
    
    return false;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    return false;
  }
}

/**
 * Test connectivity to the storage bucket and diagnose issues
 * @returns Object with diagnostic information
 */
export async function testStorageBucketConnectivity() {
  try {
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("STORAGE DIAGNOSTIC: Authentication error:", authError.message);
      return {
        success: false,
        storageAccessible: false,
        bucketExists: false,
        authStatus: false,
        authError: authError,
        error: "Authentication error",
        bucketList: []
      };
    }
    
    const isAuthenticated = !!authData.session;
    const userId = isAuthenticated ? authData.session.user.id : null;
    
    console.log("STORAGE DIAGNOSTIC: User authenticated:", isAuthenticated, "User ID:", userId);
    
    // First list buckets to check if storage API is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("STORAGE DIAGNOSTIC: Cannot list buckets:", listError);
      return {
        success: false,
        storageAccessible: false,
        bucketExists: false,
        authStatus: isAuthenticated,
        userId: userId,
        error: listError,
        bucketList: []
      };
    }
    
    console.log("STORAGE DIAGNOSTIC: Available buckets:", buckets?.map(b => b.name).join(', ') || 'none');
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("STORAGE DIAGNOSTIC: Reports bucket exists:", reportsBucketExists);
    
    // Try to access the reports bucket regardless of whether it existed before
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    
    if (reportsError) {
      console.error("STORAGE DIAGNOSTIC: Reports bucket access error:", reportsError);
    }
    
    // Test upload permission by trying a dummy upload
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
      success: reportsBucketExists && reportsAccessible,
      storageAccessible: true,
      bucketExists: reportsBucketExists,
      reportsAccessible: reportsAccessible,
      authStatus: isAuthenticated,
      userId: userId,
      error: reportsError,
      bucketList: buckets || [],
      uploadPermissionTest
    };
  } catch (error) {
    console.error("STORAGE DIAGNOSTIC: Unexpected error:", error);
    return {
      success: false,
      storageAccessible: false,
      bucketExists: false,
      reportsAccessible: false,
      authStatus: false,
      error,
      bucketList: []
    };
  }
}
