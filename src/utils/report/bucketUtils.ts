
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket existence...");
    
    // First check if the bucket exists by attempting to list files
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    // If we can list files without error, the bucket exists
    if (!listError) {
      console.log("Reports bucket exists and is accessible");
      return true;
    }
    
    console.log("Reports bucket not found or not accessible, checking all buckets...");
    
    // If listing failed, check more directly with listBuckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      // Check authentication - we might not have permission
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error("STORAGE CRITICAL: User is not authenticated, cannot create bucket");
        return false;
      }
      // Return false to trigger explicit bucket creation
      return false;
    }
    
    // Check if the 'reports' bucket exists in the returned buckets
    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (reportsBucket) {
      console.log("Reports bucket exists:", reportsBucket.id);
      return true;
    }
    
    console.log("Reports bucket not found, creating now...");
    
    // Create the bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true, // Make reports publicly accessible
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (error) {
      // Log detailed error information
      console.error("Error creating reports bucket:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error.details);
      
      // Check if it's a permission issue
      if (error.message.includes("permission") || error.code === "42501") {
        console.error("STORAGE CRITICAL: Permission denied creating bucket. User might not have admin rights.");
      }
      // Check if it's already exists (this is actually good)
      else if (error.message.includes("already exists")) {
        console.log("Bucket already exists - this is fine");
        return true;
      }
      
      return false;
    }
    
    console.log("Created 'reports' bucket successfully:", data);
    
    // Verify the creation by listing the bucket contents
    const { error: verifyError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (verifyError) {
      console.error("Error verifying new bucket:", verifyError);
      return false;
    }
    
    console.log("Successfully verified new reports bucket");
    return true;
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
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData.session;
    console.log("STORAGE DIAGNOSTIC: User authentication status:", isAuthenticated);
    
    if (!isAuthenticated) {
      console.error("STORAGE CRITICAL: User is not authenticated, storage operations will fail");
      return {
        success: false,
        authStatus: false,
        bucketExists: false,
        storageAccessible: false,
        reportsAccessible: false,
        error: new Error("User not authenticated"),
        bucketList: []
      };
    }
    
    // First try to directly access the reports bucket
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
      
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    if (reportsError) {
      console.log("STORAGE DIAGNOSTIC: Reports bucket error:", reportsError);
    }
    
    // List all buckets to check general storage access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("STORAGE CRITICAL: Cannot list buckets:", listError);
    } else {
      console.log("STORAGE DIAGNOSTIC: Available buckets:", buckets?.map(b => b.name).join(', ') || 'none');
    }
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("STORAGE DIAGNOSTIC: Reports bucket exists:", reportsBucketExists);
    
    if (!reportsBucketExists && !listError) {
      // Attempt to create the bucket
      console.log("STORAGE DIAGNOSTIC: Attempting to create reports bucket");
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error("STORAGE CRITICAL: Failed to create reports bucket:", createError);
      } else {
        console.log("STORAGE DIAGNOSTIC: Successfully created reports bucket during diagnostic");
      }
    }
    
    return {
      success: !listError && (reportsBucketExists || !listError),
      authStatus: isAuthenticated,
      bucketExists: reportsBucketExists,
      storageAccessible: !listError,
      reportsAccessible: reportsAccessible,
      error: listError || reportsError,
      bucketList: buckets || []
    };
  } catch (error) {
    console.error("Storage diagnostic error:", error);
    return {
      success: false,
      authStatus: false,
      bucketExists: false,
      storageAccessible: false,
      reportsAccessible: false,
      error,
      bucketList: []
    };
  }
}
