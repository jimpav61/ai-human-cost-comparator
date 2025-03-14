
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
      console.error("Error creating reports bucket:", error);
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
    
    // First try to directly access the reports bucket
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
      
    const reportsAccessible = !reportsError;
    
    // List all buckets to check general storage access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    
    // Log the bucket list to help with debugging
    console.log("Available buckets:", buckets);
    
    if (!reportsBucketExists && !listError) {
      // Attempt to create the bucket
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error("Failed to create reports bucket:", createError);
      } else {
        console.log("Successfully created reports bucket during diagnostic");
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
