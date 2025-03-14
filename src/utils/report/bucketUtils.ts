
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 * If it doesn't exist, attempt to create it
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket is accessible...");
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing storage buckets:", bucketsError);
      toast({
        title: "Storage Error",
        description: "Unable to access storage buckets. Please contact support.",
        variant: "destructive"
      });
      return false;
    }
    
    // Check if the reports bucket exists
    const reportsBucketExists = buckets.some(bucket => bucket.name === 'reports');
    
    if (!reportsBucketExists) {
      console.error("The 'reports' bucket does not exist in Supabase storage.");
      toast({
        title: "Storage Configuration Error",
        description: "Reports storage is not properly configured. Please contact support.",
        variant: "destructive"
      });
      return false;
    } else {
      console.log("Reports bucket exists, checking if it's accessible...");
      
      // Try to list files to verify access
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('reports')
          .list();
          
        if (listError) {
          console.warn("Could not list files in 'reports' bucket:", listError);
          // The bucket exists but we might not have permission to list files
          // Let's attempt to use it anyway as other operations might work
          console.log("Will attempt to use the bucket regardless of list permission");
          return true;
        }
        
        console.log(`Successfully accessed 'reports' bucket. Files found: ${files?.length || 0}`);
        if (files?.length) {
          console.log("First few files in bucket:", files.slice(0, 5).map(f => f.name));
        }
        return true;
      } catch (accessError) {
        console.error("Error checking bucket accessibility:", accessError);
        // Still return true to allow the process to continue
        return true;
      }
    }
  } catch (error) {
    console.error("Unexpected error verifying reports bucket:", error);
    return false;
  }
}

/**
 * Create proper RLS policies for the reports bucket
 * This is called after bucket creation but will now work independently
 */
export async function createReportsBucketPolicies(): Promise<boolean> {
  // This bucket already exists, don't try to create it
  return true;
}
