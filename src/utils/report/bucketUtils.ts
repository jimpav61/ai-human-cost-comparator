
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports buckets are accessible...");
    
    // Check both bucket names that might be in use
    let bucketExists = false;
    
    // First try the standard 'reports' bucket
    const { data: reportsData, error: reportsError } = await supabase.storage.from('reports').list();
    
    if (reportsError) {
      console.error("Error accessing 'reports' bucket:", reportsError);
      
      // Try the 'generated_reports' bucket as fallback
      const { data: genReportsData, error: genReportsError } = await supabase.storage.from('generated_reports').list();
      
      if (genReportsError) {
        console.error("Error accessing 'generated_reports' bucket:", genReportsError);
        
        // Additional debug info about error type
        if (reportsError.message.includes("row-level security policy") || 
            genReportsError.message.includes("row-level security policy")) {
          console.error("CRITICAL: RLS policy is preventing bucket access. Please check the Supabase storage bucket RLS policies.");
          toast({
            title: "Storage Access Error",
            description: "Unable to access reports storage due to permission issues. Please contact support.",
            variant: "destructive"
          });
        } else if (reportsError.message.includes("does not exist") && 
                  genReportsError.message.includes("does not exist")) {
          console.error("CRITICAL: Neither 'reports' nor 'generated_reports' buckets exist. At least one needs to be created.");
          toast({
            title: "Storage Configuration Error",
            description: "The reports storage bucket does not exist. Please contact support.",
            variant: "destructive"
          });
        }
        
        return false;
      } else {
        console.log("Successfully verified 'generated_reports' bucket exists and is accessible. Files count:", genReportsData?.length);
        bucketExists = true;
      }
    } else {
      console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", reportsData?.length);
      bucketExists = true;
    }
    
    // At least one bucket exists and is accessible
    return bucketExists;
  } catch (error) {
    console.error("Unexpected error verifying reports buckets:", error);
    toast({
      title: "Storage Error",
      description: "Unexpected error accessing storage. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
}
