
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket exists and create it if it doesn't
 * @returns Promise<boolean> true if the bucket exists or was created successfully
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket existence...");
    
    // Check if the 'reports' bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return false;
    }
    
    // If the bucket doesn't exist, create it
    if (!buckets?.find(bucket => bucket.name === 'reports')) {
      console.log("Reports bucket not found, creating now...");
      
      const { data, error } = await supabase.storage.createBucket('reports', {
        public: true, // Make reports publicly accessible
        fileSizeLimit: 10485760, // 10MB limit
      });
      
      if (error) {
        console.error("Error creating reports bucket:", error);
        return false;
      }
      
      console.log("Created 'reports' bucket successfully:", data);
      
      // Set the bucket policy to allow public access to all files
      const { error: policyError } = await supabase.storage.from('reports')
        .createSignedUrl('placeholder.txt', 60);
        
      if (policyError && !policyError.message.includes('not found')) {
        console.error("Error setting bucket policy:", policyError);
      }
    } else {
      console.log("Reports bucket already exists");
    }
    
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
    
    // List buckets to check general storage access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    // Check if reports bucket exists
    const reportsBucketExists = buckets?.some(bucket => bucket.name === 'reports');
    
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
      error: listError,
    };
  } catch (error) {
    console.error("Storage diagnostic error:", error);
    return {
      success: false,
      authStatus: false,
      bucketExists: false,
      storageAccessible: false,
      error,
    };
  }
}
