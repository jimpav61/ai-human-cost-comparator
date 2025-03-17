
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";

/**
 * Result interface for report verification
 */
export interface ReportVerificationResult {
  exists: boolean;
  companyName: string;
  error?: {
    message: string;
    code?: string;
  } | null;
  publicUrl?: string | null;
  matchingFiles?: any[];
}

/**
 * Verify if a report exists in storage for a specific lead
 * @param lead Lead to check for report
 * @returns Promise with verification result
 */
export async function verifyLeadReportStorage(lead: Lead): Promise<ReportVerificationResult> {
  if (!lead || !lead.id) {
    console.error("Cannot verify report: Invalid lead or missing ID");
    return {
      exists: false,
      companyName: lead?.company_name || 'Unknown',
      error: {
        message: "Invalid lead or missing ID"
      }
    };
  }
  
  try {
    console.log("Checking for existing report in storage for lead:", lead.id);
    
    // Standard filename format based on UUID
    const fileName = `${lead.id}.pdf`;
    
    // First check if bucket is accessible
    const { data: bucketTest, error: bucketError } = await supabase.storage
      .from('reports')
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.error("Cannot access reports bucket:", bucketError);
      return {
        exists: false,
        companyName: lead.company_name,
        error: {
          message: `Cannot access reports bucket: ${bucketError.message}`,
          code: 'BUCKET_ACCESS_ERROR'
        }
      };
    }
    
    // Look for the specific file
    const { data: files, error: listError } = await supabase.storage
      .from('reports')
      .list('', { 
        search: fileName 
      });
    
    if (listError) {
      console.error("Error listing files in reports bucket:", listError);
      return {
        exists: false,
        companyName: lead.company_name,
        error: {
          message: `Error listing files: ${listError.message}`,
          code: 'LIST_ERROR'
        }
      };
    }
    
    // Check if file exists
    const reportFile = files?.find(file => file.name === fileName);
    
    if (!reportFile) {
      console.log("No report found for lead:", lead.id);
      return {
        exists: false,
        companyName: lead.company_name,
        matchingFiles: []
      };
    }
    
    console.log("Found existing report file:", reportFile.name);
    
    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
    
    return {
      exists: true,
      companyName: lead.company_name,
      publicUrl: urlData?.publicUrl || null,
      matchingFiles: [reportFile]
    };
  } catch (error) {
    console.error("Error in verifyLeadReportStorage:", error);
    return {
      exists: false,
      companyName: lead.company_name || 'Unknown',
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
