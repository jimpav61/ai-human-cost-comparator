
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying 'reports' bucket is accessible...");
    
    // Check if the bucket exists by trying to list files in it
    const { data, error } = await supabase.storage.from('reports').list();
    
    if (error) {
      console.error("Error accessing 'reports' bucket:", error);
      
      // Additional debug info about error type
      if (error.message.includes("row-level security policy")) {
        console.error("CRITICAL: RLS policy is preventing bucket access. Please check the Supabase storage bucket 'reports' has proper RLS policies.");
        toast({
          title: "Storage Access Error",
          description: "Unable to access reports storage due to permission issues. Please contact support.",
          variant: "destructive"
        });
      } else if (error.message.includes("does not exist")) {
        console.error("CRITICAL: The 'reports' bucket does not exist. Please create it in the Supabase dashboard.");
        toast({
          title: "Storage Configuration Error",
          description: "The reports storage bucket does not exist. Please contact support.",
          variant: "destructive"
        });
      }
      
      return false;
    }
    
    console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", data?.length);
    
    // Bucket exists and is accessible
    return true;
  } catch (error) {
    console.error("Unexpected error verifying 'reports' bucket:", error);
    toast({
      title: "Storage Error",
      description: "Unexpected error accessing storage. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
}
