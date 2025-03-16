
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
    
    // Direct access test using a simpler approach - try to list files
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
        toast({
          title: "Storage Error",
          description: "Cannot access reports storage bucket. Please contact support.",
          variant: "destructive"
        });
      }
      
      return false;
    }
    
    console.log("BUCKET TEST: Reports bucket is accessible, files listing succeeded");
    console.log("BUCKET TEST: Found", fileList?.length || 0, "files");
    
    return true;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    return false;
  }
}
