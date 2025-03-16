
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
    
    // First check if reports bucket exists
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
      return false;
    }
    
    console.log("BUCKET TEST: All available buckets:", bucketList ? bucketList.map(b => b.name).join(', ') : 'none');
    
    const reportsBucketExists = bucketList.some(bucket => bucket.name === 'reports');
    console.log("BUCKET TEST: Reports bucket exists in bucket list:", reportsBucketExists);
    
    if (!reportsBucketExists) {
      console.error("Reports bucket not found");
      toast({
        title: "Storage Error",
        description: "Reports storage bucket not found. Please contact support.",
        variant: "destructive"
      });
      return false;
    }
    
    // Test if we can access the bucket by listing a single file
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
    
    console.log("BUCKET TEST: Reports bucket is accessible, found files:", fileList?.length || 0);
    if (fileList && fileList.length > 0) {
      console.log("BUCKET TEST: First few files:", fileList.slice(0, 3).map(f => f.name).join(', '));
    }
    
    return true;
  } catch (error) {
    console.error("Error in verifyReportsBucket:", error);
    return false;
  }
}
