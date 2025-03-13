
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";
import { ReportData } from "./types";
import { toJson } from "@/hooks/calculator/supabase-types";

/**
 * Check if user is authenticated with Supabase
 */
export async function checkUserAuthentication() {
  const { data: { session } } = await supabase.auth.getSession();
  return { session, isAuthenticated: !!session };
}

/**
 * Save report data to the database
 */
export async function saveReportData(lead: Lead): Promise<string | null> {
  try {
    // Generate a new UUID for the report
    const reportId = crypto.randomUUID();
    
    // Ensure the lead ID is valid UUID
    if (!lead.id || lead.id.startsWith('temp-')) {
      console.warn(`Invalid lead ID format detected: ${lead.id}, this may cause issues with storage references`);
      lead.id = crypto.randomUUID();
      console.log(`Assigned new valid UUID to lead: ${lead.id}`);
    }
    
    // Prepare report data
    const reportData: ReportData = {
      id: reportId,
      lead_id: lead.id,
      company_name: lead.company_name || "Unknown Company",
      contact_name: lead.name || "Unknown Contact",
      email: lead.email || "unknown@example.com",
      phone_number: lead.phone_number || null,
      calculator_inputs: toJson(lead.calculator_inputs),
      calculator_results: toJson(lead.calculator_results),
      report_date: new Date().toISOString(),
      version: 1 // Default to version 1
    };

    console.log("Saving report data:", reportData);

    // Check if user is authenticated
    const { session } = await checkUserAuthentication();
    
    if (!session) {
      console.error("User is not authenticated - report data cannot be saved to database");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save report data",
        variant: "destructive"
      });
      return null;
    }

    // Save to database
    const { data, error } = await supabase
      .from('generated_reports')
      .insert(reportData)
      .select('id')
      .single();

    if (error) {
      console.error("Failed to save report to database:", error);
      toast({
        title: "Database Error",
        description: "Failed to save report data. Please try again.",
        variant: "destructive"
      });
      return null;
    }

    console.log("Report saved to database with ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Unexpected error saving report:", error);
    toast({
      title: "Error",
      description: "Unexpected error saving report data. Please try again.",
      variant: "destructive"
    });
    return null;
  }
}
