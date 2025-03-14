
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket is accessible...");
    
    // Check 'reports' bucket - this is the primary bucket we should use
    const { data: reportsData, error: reportsError } = await supabase.storage.from('reports').list();
    
    if (reportsError) {
      console.error("Error accessing 'reports' bucket:", reportsError);
      
      // Only in case of error, try the 'generated_reports' bucket as fallback
      const { data: genReportsData, error: genReportsError } = await supabase.storage.from('generated_reports').list();
      
      if (genReportsError) {
        console.error("Error accessing both storage buckets:", genReportsError);
        
        if (reportsError.message.includes("does not exist") && 
            genReportsError.message.includes("does not exist")) {
          console.error("CRITICAL: No reports storage bucket exists. Please create 'reports' bucket.");
          toast({
            title: "Storage Configuration Error",
            description: "The reports storage bucket does not exist. Please contact support.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Storage Access Error",
            description: "Unable to access reports storage. Please contact support.",
            variant: "destructive"
          });
        }
        
        return false;
      } else {
        console.log("Using fallback 'generated_reports' bucket. Files count:", genReportsData?.length);
        return true;
      }
    } else {
      console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", reportsData?.length);
      return true;
    }
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
