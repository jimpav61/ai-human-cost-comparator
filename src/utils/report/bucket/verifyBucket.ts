
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Verify if the reports bucket is accessible (not if it exists)
 * @returns Promise<boolean> true if the bucket is accessible
 */
export async function verifyReportsBucket(): Promise<boolean> {
  try {
    console.log("Verifying reports bucket accessibility...");
    
    // Check authentication first - this is the most common issue
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("Authentication error:", authError.message);
      toast({
        title: "Authentication Error",
        description: "Please sign in again to access reports storage.",
        variant: "destructive"
      });
      return false;
    }
    
    const isAuthenticated = !!authData.session;
    
    if (!isAuthenticated) {
      console.error("User is not authenticated, cannot verify bucket");
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to access reports storage.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log("User authenticated with ID:", authData.session.user.id);
    
    // Direct test - try to list files with minimal options
    const { data: fileList, error: listError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error("Cannot access reports bucket:", listError);
      
      if (listError.message.includes("Permission denied")) {
        console.error("Permission denied when accessing reports bucket");
        toast({
          title: "Storage Permission Issue",
          description: "You don't have permission to access the reports bucket.",
          variant: "destructive"
        });
      } else if (listError.message.includes("not found") || listError.message.includes("exist")) {
        console.error("Reports bucket not found or doesn't exist");
        toast({
          title: "Storage Configuration Error",
          description: "Reports storage bucket not found. Contact administrator.",
          variant: "destructive"
        });
      } else {
        console.error("Error accessing reports bucket:", listError.message);
        toast({
          title: "Storage Error",
          description: "Cannot access reports storage. Contact support.",
          variant: "destructive"
        });
      }
      
      return false;
    }
    
    // Try a simple upload to verify write permissions
    const testBlob = new Blob(["test"], { type: "text/plain" });
    const testFileName = `permission_test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(testFileName, testBlob, { upsert: true });
    
    if (uploadError) {
      console.error("Cannot write to reports bucket:", uploadError);
      
      if (uploadError.message.includes("Permission denied")) {
        console.error("Permission denied when writing to reports bucket");
        toast({
          title: "Storage Write Permission Issue",
          description: "You don't have permission to upload files to the reports bucket.",
          variant: "destructive"
        });
      } else {
        console.error("Error writing to reports bucket:", uploadError.message);
        toast({
          title: "Storage Write Error",
          description: "Cannot write to reports storage. Contact support.",
          variant: "destructive"
        });
      }
      
      return false;
    }
    
    // Clean up the test file
    await supabase.storage
      .from('reports')
      .remove([testFileName]);
    
    console.log("BUCKET TEST: Reports bucket is accessible and writable!");
    console.log("BUCKET TEST: Found", fileList?.length || 0, "files");
    
    return true;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    toast({
      title: "Storage Error",
      description: "Unexpected error verifying reports storage.",
      variant: "destructive"
    });
    return false;
  }
}
