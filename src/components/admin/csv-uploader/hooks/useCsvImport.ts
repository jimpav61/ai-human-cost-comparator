
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useCsvImport = (file: File | null, setFile: (file: File | null) => void) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseCSV = (text: string) => {
    const lines = text.split("\n");
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(",").map(header => header.trim());
    
    // Check if the CSV has at least the required columns
    const requiredColumns = ["name", "email", "company_name"];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`CSV missing required columns: ${missingColumns.join(", ")}`);
    }
    
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle values that might contain commas
      const values: string[] = [];
      let inQuotes = false;
      let currentValue = "";
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      // Push the last value
      values.push(currentValue.trim());
      
      const row: Record<string, any> = {};
      for (let j = 0; j < headers.length; j++) {
        // Skip empty values
        if (j < values.length) {
          const value = values[j].replace(/^"(.+)"$/, '$1'); // Remove surrounding quotes
          row[headers[j]] = value;
        }
      }
      
      results.push(row);
    }
    
    return results;
  };

  const uploadCSV = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        throw new Error("No valid data found in CSV");
      }
      
      const totalRows = rows.length;
      let processedRows = 0;
      let successCount = 0;
      
      // Process the rows in batches to prevent timeouts
      const batchSize = 10;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        // Map batch data to the leads table structure
        const leadsToInsert = batch.map(row => ({
          name: row.name || "",
          company_name: row.company_name || "",
          email: row.email || "",
          phone_number: row.phone_number || null,
          website: row.website || null,
          industry: row.industry || null,
          employee_count: row.employee_count ? parseInt(row.employee_count) : null,
          form_completed: true,
          calculator_inputs: row.calculator_inputs ? JSON.parse(row.calculator_inputs) : {},
          calculator_results: row.calculator_results ? JSON.parse(row.calculator_results) : {},
          proposal_sent: row.proposal_sent === "true" || row.proposal_sent === "TRUE" || row.proposal_sent === "1"
        } as any));
        
        // Insert batch into Supabase
        const { data, error } = await supabase
          .from('leads')
          .insert(leadsToInsert);
          
        if (error) {
          console.error("Error importing leads batch:", error);
          // Continue with next batch anyway
        } else {
          successCount += batch.length;
        }
        
        processedRows += batch.length;
        const newProgress = Math.floor((processedRows / totalRows) * 100);
        setProgress(newProgress);
      }
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} of ${totalRows} leads.`,
        duration: 5000,
      });
      
      // Reset the file input
      setFile(null);
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
    } catch (error: any) {
      console.error("Error processing CSV:", error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to process CSV file.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { isUploading, progress, uploadCSV };
};
