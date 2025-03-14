
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Verify the reports bucket exists and is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket is accessible...");
    
    // First check if 'reports' bucket exists and is accessible (primary bucket)
    const { data: reportsData, error: reportsError } = await supabase.storage.from('reports').list();
    
    if (!reportsError) {
      console.log("Successfully verified 'reports' bucket exists and is accessible. Files count:", reportsData?.length);
      
      if (reportsData && reportsData.length > 0) {
        console.log("Files in reports bucket:", reportsData.map(f => f.name));
      }
      
      return true;
    }
    
    console.error("Error accessing 'reports' bucket:", reportsError);
    
    // Only check 'generated_reports' bucket as fallback if reports bucket had an error
    const { data: genReportsData, error: genReportsError } = await supabase.storage.from('generated_reports').list();
    
    if (!genReportsError) {
      console.log("Using fallback 'generated_reports' bucket. Files count:", genReportsData?.length);
      return true;
    }
    
    console.error("Error accessing both storage buckets:", genReportsError);
    
    // If both buckets don't exist, show appropriate error
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
