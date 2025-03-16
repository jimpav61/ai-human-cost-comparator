
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
    
    // Instead of checking if bucket exists, test if we can access it
    // by trying to list a single file
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
      }
      
      return false;
    }
    
    console.log("Reports bucket is accessible");
    return true;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    return false;
  }
}

/**
 * Test connectivity to the storage bucket and diagnose issues
 * @returns Object with diagnostic information
 */
export async function testStorageBucketConnectivity() {
  try {
    // Check if user is authenticated
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error("STORAGE DIAGNOSTIC: Authentication error:", authError.message);
      return {
        success: false,
        storageAccessible: false,
        bucketAccessible: false,
        bucketExists: false, // Add for backward compatibility
        bucketList: [], // Add for backward compatibility
        authStatus: false,
        authError: authError,
        error: "Authentication error",
      };
    }
    
    const isAuthenticated = !!authData.session;
    const userId = isAuthenticated ? authData.session.user.id : null;
    
    console.log("STORAGE DIAGNOSTIC: User authenticated:", isAuthenticated, "User ID:", userId);
    
    // Directly test if we can access the reports bucket
    const { data: reportsList, error: reportsError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    const reportsAccessible = !reportsError;
    console.log("STORAGE DIAGNOSTIC: Reports bucket accessible:", reportsAccessible);
    
    if (reportsError) {
      console.error("STORAGE DIAGNOSTIC: Reports bucket access error:", reportsError);
    }
    
    // Only test upload if we can access the bucket
    let uploadPermissionTest = { success: false, error: null };
    
    if (reportsAccessible && isAuthenticated) {
      const testBlob = new Blob(["test"], { type: "text/plain" });
      const testPath = `permission_test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(testPath, testBlob, {
          upsert: true
        });
      
      if (uploadError) {
        console.error("STORAGE DIAGNOSTIC: Upload permission test failed:", uploadError);
        uploadPermissionTest = { success: false, error: uploadError };
      } else {
        console.log("STORAGE DIAGNOSTIC: Upload permission test succeeded");
        uploadPermissionTest = { success: true, error: null };
        
        // Clean up test file
        await supabase.storage.from('reports').remove([testPath]);
      }
    }
    
    return {
      success: reportsAccessible,
      storageAccessible: true,
      bucketAccessible: reportsAccessible,
      bucketExists: reportsAccessible, // Add for backward compatibility
      bucketList: reportsAccessible ? ['reports'] : [], // Add for backward compatibility
      authStatus: isAuthenticated,
      userId: userId,
      error: reportsError,
      uploadPermissionTest
    };
  } catch (error) {
    console.error("STORAGE DIAGNOSTIC: Unexpected error:", error);
    return {
      success: false,
      storageAccessible: false,
      bucketAccessible: false,
      bucketExists: false, // Add for backward compatibility
      bucketList: [], // Add for backward compatibility
      authStatus: false,
      error,
    };
  }
}
