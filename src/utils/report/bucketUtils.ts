
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
    
    // First attempt to list all buckets to see if 'reports' exists
    const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
    console.log("Available buckets:", bucketList);
    
    if (bucketError) {
      console.error("Error listing buckets:", bucketError);
    } else {
      const reportsBucketExists = bucketList.some(bucket => bucket.name === 'reports');
      console.log("Reports bucket exists in bucket list:", reportsBucketExists);
      
      if (!reportsBucketExists) {
        console.log("Reports bucket not found, attempting to create it...");
        try {
          const { data: createData, error: createError } = await supabase.storage
            .createBucket('reports', { 
              public: true,
              fileSizeLimit: 10485760 // 10MB
            });
            
          if (createError) {
            console.error("Failed to create reports bucket:", createError);
          } else {
            console.log("Successfully created reports bucket");
            // Return early since we just created the bucket
            return true;
          }
        } catch (createBucketError) {
          console.error("Error creating reports bucket:", createBucketError);
        }
      }
    }
    
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
    console.log("BUCKET TEST: Starting comprehensive storage diagnostic");
    
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
    
    // First check which buckets are available
    let bucketsList = [];
    let bucketsError = null;
    
    try {
      const { data: availableBuckets, error: listBucketsError } = await supabase.storage.listBuckets();
      
      if (listBucketsError) {
        console.error("STORAGE DIAGNOSTIC: Error listing buckets:", listBucketsError);
        bucketsError = listBucketsError;
      } else {
        bucketsList = availableBuckets;
        console.log("STORAGE DIAGNOSTIC: Available buckets:", bucketsList.map(b => b.name).join(', '));
        
        // Check if reports bucket exists
        const reportsBucketExists = bucketsList.some(bucket => bucket.name === 'reports');
        console.log("STORAGE DIAGNOSTIC: Reports bucket exists:", reportsBucketExists);
        
        // If reports bucket doesn't exist, try to create it
        if (!reportsBucketExists) {
          console.log("STORAGE DIAGNOSTIC: Reports bucket not found, attempting to create it...");
          
          try {
            const { data: createData, error: createError } = await supabase.storage
              .createBucket('reports', { 
                public: true,
                fileSizeLimit: 10485760 // 10MB
              });
              
            if (createError) {
              console.error("STORAGE DIAGNOSTIC: Failed to create reports bucket:", createError);
            } else {
              console.log("STORAGE DIAGNOSTIC: Successfully created reports bucket");
              // Add the newly created bucket to our list
              bucketsList.push({ name: 'reports', id: 'reports' });
            }
          } catch (createError) {
            console.error("STORAGE DIAGNOSTIC: Error creating bucket:", createError);
          }
        }
      }
    } catch (bucketsCheckError) {
      console.error("STORAGE DIAGNOSTIC: Unexpected error listing buckets:", bucketsCheckError);
      bucketsError = bucketsCheckError;
    }
    
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
      uploadPermissionTest,
      availableBuckets: bucketsList.map(b => b.name),
      bucketsError
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
