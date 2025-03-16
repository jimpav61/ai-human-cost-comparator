
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SavedReport {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  report_date: string;
  calculator_inputs: any;
  calculator_results: any;
  lead_id: string | null; // Updated to allow null since some existing reports might not have lead_id
  pdf_url?: string; // Add field for PDF URL if available
}

export const useSavedReports = (leadId?: string) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReports = async () => {
    if (!leadId) return;
    
    setIsLoading(true);
    try {
      console.log("📊 REPORT FINDER: Starting search for lead ID:", leadId);
      
      // Try all possible ways to find the report, capturing all results first
      const searchResults = [];
      
      // 1. Try direct lead_id match
      const { data: leadIdMatches, error: leadIdError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', leadId)
        .order('report_date', { ascending: false });
        
      if (leadIdError) {
        console.error("📊 REPORT FINDER: Error searching by lead_id:", leadIdError);
      } else if (leadIdMatches && leadIdMatches.length > 0) {
        console.log(`📊 REPORT FINDER: Found ${leadIdMatches.length} reports by lead_id match`);
        searchResults.push(...leadIdMatches);
      }
      
      // 2. Try exact id match (report id = lead id)
      const { data: exactMatch, error: exactMatchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('id', leadId)
        .maybeSingle();
        
      if (exactMatchError) {
        console.error("📊 REPORT FINDER: Error searching by report id:", exactMatchError);
      } else if (exactMatch) {
        console.log("📊 REPORT FINDER: Found report by direct ID match");
        if (!searchResults.some(r => r.id === exactMatch.id)) {
          searchResults.push(exactMatch);
        }
      }
      
      // CRITICAL FIX: Search for reports in storage using ONLY the lead's UUID
      if (searchResults.length > 0) {
        console.log("📊 REPORT FINDER: Found database entries, now checking storage");
        // Check for stored PDF files for each report
        for (const report of searchResults) {
          try {
            // CRITICAL FIX: Use ONLY lead UUID as the primary filename format
            // Format: {leadId}.pdf - this is now our standard
            const exactUuidFileName = `${leadId}.pdf`;
            
            console.log("📊 REPORT FINDER: Checking for PDF file with name:", exactUuidFileName);
            
            // Get the public URL directly with the standard name
            const { data: urlData } = await supabase.storage
              .from('reports')
              .getPublicUrl(exactUuidFileName);
            
            if (urlData && urlData.publicUrl) {
              console.log(`📊 REPORT FINDER: Generated public URL for file ${exactUuidFileName}`);
              // Verify the URL actually resolves to a file
              try {
                const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
                if (response.ok) {
                  report.pdf_url = urlData.publicUrl;
                  console.log("📊 REPORT FINDER: File exists and is accessible");
                } else {
                  console.log("📊 REPORT FINDER: File exists but is not accessible, status:", response.status);
                }
              } catch (fetchError) {
                console.error("📊 REPORT FINDER: Error checking file accessibility:", fetchError);
              }
            } else {
              console.log("📊 REPORT FINDER: No URL generated for file", exactUuidFileName);
              
              // Fall back to listing files to look for ones that start with the UUID
              const { data: fileList, error: listError } = await supabase.storage
                .from('reports')
                .list('', { limit: 20 });
                
              if (listError) {
                console.error("📊 REPORT FINDER: Error listing files:", listError);
              } else if (fileList && fileList.length > 0) {
                // Look for files that match our UUID pattern
                const matchingFiles = fileList.filter(file => 
                  file.name === exactUuidFileName || 
                  file.name.startsWith(`${leadId}.`) || 
                  file.name.startsWith(`${leadId}_`)
                );
                
                if (matchingFiles.length > 0) {
                  console.log("📊 REPORT FINDER: Found matching files:", matchingFiles.map(f => f.name).join(', '));
                  
                  // Get URL for the first matching file
                  const { data: fallbackUrlData } = await supabase.storage
                    .from('reports')
                    .getPublicUrl(matchingFiles[0].name);
                    
                  if (fallbackUrlData && fallbackUrlData.publicUrl) {
                    report.pdf_url = fallbackUrlData.publicUrl;
                    console.log("📊 REPORT FINDER: Generated URL for fallback file:", matchingFiles[0].name);
                  }
                } else {
                  console.log("📊 REPORT FINDER: No matching files found in storage");
                }
              }
            }
          } catch (fileCheckError) {
            console.error("📊 REPORT FINDER: Error checking for PDF file:", fileCheckError);
          }
        }
      }
      
      // Show search summary
      if (searchResults.length > 0) {
        console.log(`📊 REPORT FINDER: Search complete. Found ${searchResults.length} total reports.`);
        console.log("📊 REPORT FINDER: Reports with PDF URLs:", searchResults.filter(r => r.pdf_url).length);
        setReports(searchResults);
      } else {
        // If no matches, log a comprehensive debug message
        console.log("📊 REPORT FINDER: No reports found for this lead. Debug info:");
        console.log("- Lead ID searched:", leadId);
        
        // Check directly in storage for any files with this UUID
        try {
          const { data: fileList } = await supabase.storage
            .from('reports')
            .list('', { limit: 100 });
            
          const matchingFiles = fileList?.filter(file => 
            file.name === `${leadId}.pdf` || 
            file.name.startsWith(`${leadId}.`) || 
            file.name.startsWith(`${leadId}_`)
          ) || [];
          
          if (matchingFiles.length > 0) {
            console.log("📊 REPORT FINDER: Found files in storage but no database entries:", 
              matchingFiles.map(f => f.name).join(', '));
          } else {
            console.log("📊 REPORT FINDER: No matching files found in storage either");
          }
        } catch (storageError) {
          console.error("📊 REPORT FINDER: Error checking storage:", storageError);
        }
        
        setReports([]);
      }
    } catch (error) {
      console.error("📊 REPORT FINDER: Unexpected error:", error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchReports();
    }
  }, [leadId]);

  return {
    reports,
    isLoading,
    refreshReports: fetchReports
  };
};
