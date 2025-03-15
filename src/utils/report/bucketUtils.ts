
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket existence...");
    
    // First, check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return false;
    }
    
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("Reports bucket exists:", reportsBucketExists);
    
    if (reportsBucketExists) {
      console.log("Reports bucket already exists, no need to create it");
      return true;
    }
    
    // If the bucket doesn't exist, create it
    console.log("Creating reports bucket...");
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true, // Make it publicly accessible
      fileSizeLimit: 10485760, // 10MB limit
    });
    
    if (error) {
      // If there's an error other than "already exists", log it
      if (!error.message?.includes("already exists")) {
        console.error("Error creating bucket:", error);
        return false;
      } else {
        console.log("Bucket already exists (from error message)");
        return true;
      }
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
    const { data: authData } = await supabase.auth.getSession();
    const isAuthenticated = !!authData.session;
    console.log("STORAGE DIAGNOSTIC: User authenticated:", isAuthenticated);
    
    // First list buckets to check if storage API is accessible
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("STORAGE DIAGNOSTIC: Cannot list buckets:", listError);
      return {
        success: false,
        storageAccessible: false,
        bucketExists: false,
        authStatus: isAuthenticated,
        error: listError,
        bucketList: []
      };
    }
    
    console.log("STORAGE DIAGNOSTIC: Available buckets:", buckets?.map(b => b.name).join(', ') || 'none');
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    console.log("STORAGE DIAGNOSTIC: Reports bucket exists:", reportsBucketExists);
    
    if (!reportsBucketExists) {
      console.log("STORAGE DIAGNOSTIC: Reports bucket does not exist, attempting to create it");
      
      // Attempt to create the bucket
      const { data: createData, error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error("STORAGE DIAGNOSTIC: Failed to create reports bucket:", createError);
      } else {
        console.log("STORAGE DIAGNOSTIC: Successfully created reports bucket");
      }
    }
    
    // Try to access the reports bucket regardless of whether it existed before
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    
    if (reportsError) {
      console.log("STORAGE DIAGNOSTIC: Reports bucket access error:", reportsError);
    }
    
    return {
      success: reportsBucketExists && reportsAccessible,
      storageAccessible: true,
      bucketExists: reportsBucketExists,
      reportsAccessible: reportsAccessible,
      authStatus: isAuthenticated,
      error: reportsError,
      bucketList: buckets || []
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
