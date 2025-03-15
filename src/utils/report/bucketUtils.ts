import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket existence...");
    
    // Simplified approach - try to create the bucket anyway
    // If it already exists, Supabase will return an error we can safely ignore
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (error) {
      // If the error message contains "already exists", we can consider this a success
      if (error.message && error.message.includes("already exists")) {
        console.log("Bucket already exists - this is fine");
        return true;
      }
      
      console.error("Error creating bucket:", error);
      return false;
    }
    
    console.log("Created 'reports' bucket successfully:", data);
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
