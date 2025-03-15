
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("STORAGE TRACKING: Verifying reports bucket existence...");
    
    // First check if the bucket exists by attempting to list files
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    // If we can list files without error, the bucket exists
    if (!listError) {
      console.log("STORAGE TRACKING: Reports bucket exists and is accessible");
      return true;
    }
    
    console.log("STORAGE TRACKING: Reports bucket not found or not accessible, checking all buckets...");
    
    // If listing failed, check more directly with listBuckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("STORAGE TRACKING: Error listing buckets:", bucketsError);
      // Check authentication - we might not have permission
      const { data: session } = await supabase.auth.getSession();
      console.log("STORAGE TRACKING: Session check:", !!session.session);
      
      if (!session.session) {
        console.error("STORAGE TRACKING: User is not authenticated, cannot create bucket");
        return false;
      }
      // Return false to trigger explicit bucket creation
      return false;
    }
    
    // Check if the 'reports' bucket exists in the returned buckets
    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (reportsBucket) {
      console.log("STORAGE TRACKING: Reports bucket exists:", reportsBucket.id);
      return true;
    }
    
    console.log("STORAGE TRACKING: Reports bucket not found, creating now...");
    
    // Create the bucket if it doesn't exist
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true, // Make reports publicly accessible
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (error) {
      // Log detailed error information
      console.error("STORAGE TRACKING: Error creating reports bucket:", error);
      console.error("STORAGE TRACKING: Error message:", error.message);
      
      // Check if it's a permission issue - using error message text instead of code
      if (error.message && error.message.includes("permission")) {
        console.error("STORAGE TRACKING: Permission denied creating bucket. User might not have admin rights.");
      }
      // Check if it's already exists (this is actually good)
      else if (error.message && error.message.includes("already exists")) {
        console.log("STORAGE TRACKING: Bucket already exists - this is fine");
        return true;
      }
      
      return false;
    }
    
    console.log("STORAGE TRACKING: Created 'reports' bucket successfully:", data);
    
    // Verify the creation by listing the bucket contents
    const { error: verifyError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (verifyError) {
      console.error("STORAGE TRACKING: Error verifying new bucket:", verifyError);
      return false;
    }
    
    console.log("STORAGE TRACKING: Successfully verified new reports bucket");
    return true;
  } catch (error) {
    console.error("STORAGE TRACKING: Error in verifyReportsBucket:", error);
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
    console.log("STORAGE TRACKING: User authentication status:", isAuthenticated);
    console.log("STORAGE TRACKING: Session data:", sessionData);
    
    if (!isAuthenticated) {
      console.error("STORAGE TRACKING: User is not authenticated, storage operations will fail");
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
    console.log("STORAGE TRACKING: Reports bucket accessible:", reportsAccessible);
    if (reportsError) {
      console.log("STORAGE TRACKING: Reports bucket error:", reportsError);
    }
    
    // List all buckets to check general storage access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("STORAGE TRACKING: Cannot list buckets:", listError);
    } else {
      console.log("STORAGE TRACKING: Available buckets:", buckets?.map(b => b.name).join(', ') || 'none');
    }
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("STORAGE TRACKING: Reports bucket exists:", reportsBucketExists);
    
    if (!reportsBucketExists && !listError) {
      // Attempt to create the bucket
      console.log("STORAGE TRACKING: Attempting to create reports bucket");
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error("STORAGE TRACKING: Failed to create reports bucket:", createError);
      } else {
        console.log("STORAGE TRACKING: Successfully created reports bucket during diagnostic");
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
    console.error("STORAGE TRACKING: Diagnostic error:", error);
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
