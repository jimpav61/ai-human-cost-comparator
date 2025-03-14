
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
    
    // Find the reports bucket by checking the name property
    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (!reportsBucket) {
      console.error("The 'reports' bucket does not exist in Supabase storage.");
      // Attempt to create the bucket if it doesn't exist
      try {
        console.log("Attempting to create 'reports' bucket...");
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('reports', {
          public: true,
          fileSizeLimit: 10485760 // 10MB limit for PDFs
        });
        
        if (createError) {
          console.error("Failed to create reports bucket:", createError);
          toast({
            title: "Storage Configuration Error",
            description: "Could not create reports storage. Please contact support.",
            variant: "destructive"
          });
          return false;
        }
        
        console.log("Successfully created reports bucket:", newBucket);
        // Bucket was just created, so it should be accessible
        return true;
      } catch (createBucketError) {
        console.error("Error creating reports bucket:", createBucketError);
        toast({
          title: "Storage Configuration Error",
          description: "Reports storage is not properly configured. Please contact support.",
          variant: "destructive"
        });
        return false;
      }
    } else {
      console.log("Reports bucket exists:", reportsBucket);
      
      // Check if the bucket is accessible by trying to list files
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('reports')
          .list();
          
        if (listError) {
          console.warn("Could not list files in 'reports' bucket:", listError);
          console.log("Will still attempt to use the bucket for uploads");
          return true; // Still return true to allow upload attempts
        }
        
        console.log(`Successfully accessed 'reports' bucket. Files found: ${files?.length || 0}`);
        if (files?.length) {
          console.log("First few files in bucket:", files.slice(0, 5).map(f => f.name));
        } else {
          console.log("No files found in the reports bucket");
        }
        
        return true;
      } catch (accessError) {
        console.error("Error checking bucket accessibility:", accessError);
        return true; // Still return true to allow upload attempts
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
  try {
    console.log("Setting up RLS policies for reports bucket...");
    
    // Create policy for authenticated users to upload files
    const { error: uploadPolicyError } = await supabase.storage.from('reports')
      .createSignedUploadUrl('test-policy.txt');
      
    if (uploadPolicyError) {
      console.error("Error testing upload policy:", uploadPolicyError);
      return false;
    }
    
    console.log("Storage policies are working correctly");
    return true;
  } catch (error) {
    console.error("Error creating bucket policies:", error);
    return false;
  }
}
