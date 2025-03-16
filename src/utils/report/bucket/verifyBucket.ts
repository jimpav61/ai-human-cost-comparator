
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket is accessible (not if it exists)
 * @returns Promise<boolean> true if the bucket is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket accessibility...");
    
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
    
    // First attempt to list all buckets to see if 'reports' exists
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    console.log("Available buckets:", bucketList);
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
    } else {
      const reportsBucketExists = bucketList.some(bucket => bucket.name === 'reports');
      console.log("Reports bucket exists in bucket list:", reportsBucketExists);
      
      if (!reportsBucketExists) {
        console.log("Reports bucket not found, attempting to create it...");
        try {
          const { data: createData, error: createError } = await supabase.storage
            .createBucket('reports', { 
              public: true,
              fileSizeLimit: 10485760 // 10MB
            });
            
          if (createError) {
            console.error("Failed to create reports bucket:", createError);
          } else {
            console.log("Successfully created reports bucket");
            // Return early since we just created the bucket
            return true;
          }
        } catch (createBucketError) {
          console.error("Error creating reports bucket:", createBucketError);
        }
      }
    }
    
    // Instead of checking if bucket exists, test if we can access it
    // by trying to list a single file
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error("Cannot access reports bucket:", listError);
      
      // Check if it's a permission issue
      if (listError.message.includes("Permission denied")) {
        console.error("Permission denied when accessing reports bucket");
        toast({
          title: "Storage Permission Issue",
          description: "You don't have permission to access the reports bucket. Please check your user permissions.",
          variant: "destructive"
        });
      } else {
        console.error("Error accessing reports bucket:", listError.message);
      }
      
      return false;
    }
    
    console.log("Reports bucket is accessible");
    return true;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    return false;
  }
}
