
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

/**
 * Test storage bucket connectivity and report diagnostic information
 * This is a utility function for debugging storage issues
 */
export async function testStorageBucketConnectivity(): Promise<{
  success: boolean;
  bucketExists: boolean;
  filesCount: number;
  authStatus: boolean;
  error?: any;
}> {
  try {
    // Check authentication status
    const { data: { session } } = await supabase.auth.getSession();
    const authStatus = !!session;
    
    console.log("[DIAGNOSTIC] Storage connectivity test initiated");
    console.log("[DIAGNOSTIC] Auth status:", authStatus ? "Authenticated" : "Not authenticated");
    
    // Try to get bucket info
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("[DIAGNOSTIC] Error listing buckets:", bucketsError);
      return {
        success: false,
        bucketExists: false,
        filesCount: 0,
        authStatus,
        error: bucketsError
      };
    }
    
    console.log("[DIAGNOSTIC] Available buckets:", buckets.map(b => b.name).join(", "));
    
    // Check if reports bucket exists
    const reportsBucket = buckets.find(b => b.name === 'reports');
    const bucketExists = !!reportsBucket;
    
    if (!bucketExists) {
      console.log("[DIAGNOSTIC] Reports bucket does not exist in the list of available buckets");
      return {
        success: false,
        bucketExists: false,
        filesCount: 0, 
        authStatus,
        error: "Bucket not found"
      };
    }
    
    // Try to list files to verify access
    const { data: files, error: listError } = await supabase.storage.from('reports').list();
    
    if (listError) {
      console.error("[DIAGNOSTIC] Error listing files in 'reports' bucket:", listError);
      return {
        success: false,
        bucketExists: true,
        filesCount: 0,
        authStatus,
        error: listError
      };
    }
    
    console.log("[DIAGNOSTIC] Successfully accessed 'reports' bucket");
    console.log("[DIAGNOSTIC] Files in bucket:", files.length);
    if (files.length > 0) {
      console.log("[DIAGNOSTIC] First few files:", files.slice(0, 5).map(f => f.name).join(", "));
    }
    
    return {
      success: true,
      bucketExists: true,
      filesCount: files.length,
      authStatus
    };
  } catch (error) {
    console.error("[DIAGNOSTIC] Unexpected error in storage connectivity test:", error);
    return {
      success: false,
      bucketExists: false,
      filesCount: 0,
      authStatus: false,
      error
    };
  }
}
