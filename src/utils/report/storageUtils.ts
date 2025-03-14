
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensure the reports bucket exists, creating it if needed
 */
export const verifyReportsBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
    
    const reportsBucketExists = buckets.some(bucket => bucket.name === 'reports');
    
    if (!reportsBucketExists) {
      console.log("Reports bucket doesn't exist. Creating it...");
      
      const { error: createError } = await supabase.storage.createBucket('reports', {
        public: true
      });
      
      if (createError) {
        console.error("Error creating reports bucket:", createError);
        throw createError;
      }
      
      console.log("Reports bucket created successfully");
    } else {
      console.log("Reports bucket already exists");
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying reports bucket:", error);
    return false;
  }
};

/**
 * Get a report file from storage by different identifiers
 */
export const findReportInStorage = async (
  identifiers: string[]
): Promise<string | null> => {
  try {
    // List all files in the reports bucket
    const { data: files, error } = await supabase
      .storage
      .from('reports')
      .list();
      
    if (error) {
      console.error("Error listing files in reports bucket:", error);
      return null;
    }
    
    if (!files || files.length === 0) {
      console.log("No files found in reports bucket");
      return null;
    }
    
    console.log("Found files in reports bucket:", files.map(f => f.name));
    
    // Try to find a file that matches any of the provided identifiers
    for (const id of identifiers) {
      const matchingFile = files.find(file => file.name.includes(id));
      
      if (matchingFile) {
        console.log(`Found matching file using identifier '${id}':`, matchingFile.name);
        
        // Get the public URL
        const { data: urlData } = await supabase
          .storage
          .from('reports')
          .getPublicUrl(matchingFile.name);
          
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      }
    }
    
    console.log("No matching files found with the provided identifiers");
    return null;
  } catch (error) {
    console.error("Error finding report in storage:", error);
    return null;
  }
};
