
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText } from "lucide-react";

export const CsvUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive",
      });
      setFile(null);
      if (e.target) e.target.value = "";
    }
  };

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
        }));
        
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Leads from CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="text-xs text-gray-500">
              CSV must include columns: name, email, company_name
            </div>
          </div>
          
          {file && (
            <div className="text-sm">
              Selected file: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
            </div>
          )}
          
          {isUploading && progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-brand-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          
          <Button 
            onClick={uploadCSV} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Import
              </>
            )}
          </Button>
          
          <div className="text-xs text-gray-500 mt-2">
            <p>Download a <a href="#" className="text-brand-500 hover:underline" onClick={(e) => {
              e.preventDefault();
              const csvContent = "name,email,company_name,phone_number,website,industry,employee_count\nJohn Doe,john@example.com,Example Inc,555-1234,example.com,Technology,25";
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'leads_template.csv';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>template CSV file</a> to see the required format.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
