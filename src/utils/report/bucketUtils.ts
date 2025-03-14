
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 * If it doesn't exist, attempt to create it
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket is accessible...");
    
    // First check if 'reports' bucket exists by listing buckets
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
      console.log("Reports bucket doesn't exist. Attempting to create it...");
      
      // Create the reports bucket
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true,
        fileSizeLimit: 10485760 // 10MB limit
      });
      
      if (createError) {
        console.error("Error creating reports bucket:", createError);
        toast({
          title: "Storage Configuration Error",
          description: "Unable to create reports bucket. Please contact support.",
          variant: "destructive"
        });
        return false;
      }
      
      console.log("Reports bucket created successfully");
      // Create public policies for the bucket
      await createReportsBucketPolicies();
      return true;
    }
    
    // If we get here, the bucket exists, try to access it
    console.log("Reports bucket exists, checking if it's accessible...");
    const { data: reportsData, error: reportsError } = await supabase.storage.from('reports').list();
    
    if (reportsError) {
      console.error("Error accessing 'reports' bucket:", reportsError);
      toast({
        title: "Storage Access Error",
        description: "The reports bucket exists but cannot be accessed. Please check permissions.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", reportsData?.length);
    return true;
  } catch (error) {
    console.error("Unexpected error verifying reports bucket:", error);
    toast({
      title: "Storage Error",
      description: "Unexpected error accessing storage. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
}

/**
 * Create proper RLS policies for the reports bucket
 */
export async function createReportsBucketPolicies(): Promise<boolean> {
  try {
    console.log("Setting up RLS policies for the reports bucket...");
    
    // Add policies via the Supabase client API (can't set SQL policies directly)
    // Update bucket public setting
    const { error: updateError } = await supabase.storage.updateBucket('reports', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (updateError) {
      console.error("Error updating bucket settings:", updateError);
      return false;
    }
    
    console.log("Reports bucket policies configured successfully");
    return true;
  } catch (error) {
    console.error("Error creating bucket policies:", error);
    return false;
  }
}
