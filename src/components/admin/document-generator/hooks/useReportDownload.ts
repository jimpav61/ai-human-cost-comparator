
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "./report-generator/saveReport";
import { generatePDF } from "@/components/calculator/pdf";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

export const useReportDownload = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDownloadReport = async (lead: Lead) => {
    try {
      setIsLoading(true);
      console.log('---------- ADMIN REPORT DOWNLOAD ATTEMPT ----------');
      console.log('Lead ID for report download:', lead.id);
      console.log('Lead calculator_inputs:', lead.calculator_inputs);
      console.log('Lead calculator_results:', lead.calculator_results);
      
      // Check if lead ID exists
      if (!lead.id) {
        throw new Error("Lead ID is missing");
      }
      
      // First, try to find the report in the database with a more streamlined approach
      const { data: reportResults, error: searchError } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', lead.id)
        .order('report_date', { ascending: false })
        .limit(1);
      
      if (searchError) {
        console.error('Error searching for reports:', searchError);
        throw new Error('Failed to search for reports');
      }
      
      if (reportResults && reportResults.length > 0) {
        const report = reportResults[0];
        console.log('Found report for lead:', report.id);
        
        // Look for stored PDF in Supabase storage
        const pdfFileName = `${report.id}.pdf`;
        console.log('Checking for PDF file:', pdfFileName);
        
        try {
          // Get the public URL directly
          const { data: urlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(pdfFileName);
          
          if (urlData && urlData.publicUrl) {
            console.log('Found stored PDF, downloading from:', urlData.publicUrl);
            
            // Verify the URL is accessible
            try {
              const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
              
              if (response.ok) {
                // Trigger direct download of the PDF using the URL
                const link = document.createElement('a');
                link.href = urlData.publicUrl;
                const safeCompanyName = getSafeFileName(lead);
                link.download = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast({
                  title: "Report Downloaded",
                  description: "The original report has been successfully downloaded.",
                  duration: 1000,
                });
                
                setIsLoading(false);
                return;
              } else {
                console.log(`PDF URL check failed with status ${response.status}. Generating new PDF.`);
              }
            } catch (checkError) {
              console.error("Error verifying PDF URL:", checkError);
            }
          }
        } catch (storageError) {
          console.error('Error checking stored PDF:', storageError);
        }
        
        // If stored PDF not found or not accessible, generate from report data
        console.log('No stored PDF found or not accessible, generating from report data');
        await generateAndUploadPDF(report, lead);
        setIsLoading(false);
        return;
      }
      
      // If no reports were found, generate a new one if we have calculator data
      if (lead.calculator_results) {
        console.log('No reports found, generating new report from lead data');
        
        // Create a temporary report object
        const tempReport = {
          id: lead.id,
          lead_id: lead.id,
          company_name: lead.company_name,
          contact_name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number,
          calculator_inputs: lead.calculator_inputs,
          calculator_results: lead.calculator_results
        };
        
        await generateAndUploadPDF(tempReport, lead);
        setIsLoading(false);
        return;
      }
      
      // If we get here, no reports were found and no calculator data exists
      console.error('No reports found and no calculator data available for lead:', lead.id);
      
      toast({
        title: "No Report Available",
        description: "No report data was found for this lead. Please generate a report first.",
        variant: "warning",
      });
      
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to download report.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("---------- ADMIN REPORT DOWNLOAD ATTEMPT ENDED ----------");
    }
  };
  
  // Helper function to generate and upload PDF from a report
  const generateAndUploadPDF = async (report: any, lead: Lead) => {
    try {
      console.log('Generating and uploading PDF for report:', {
        reportId: report.id, 
        leadId: report.lead_id,
        company: report.company_name
      });
      
      // Generate safe filename for the report
      const safeCompanyName = getSafeFileName(lead);
      const fileName = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
      
      // Parse calculator results and inputs from JSON strings if needed
      let calculatorResultsData = ensureJsonParsed(report.calculator_results);
      let calculatorInputsData = ensureJsonParsed(report.calculator_inputs);
      
      console.log('Calculator results data:', calculatorResultsData);
      console.log('Calculator inputs data:', calculatorInputsData);
      
      // Validate and ensure the calculator results have the correct structure
      const validatedResults = ensureCompleteCalculatorResults(calculatorResultsData);
      
      // CRITICAL FIX: Ensure additionalVoiceMinutes is correctly handled
      let additionalVoiceMinutes = 0;
      
      // Check all possible sources for additionalVoiceMinutes
      if (typeof validatedResults.additionalVoiceMinutes === 'number') {
        additionalVoiceMinutes = validatedResults.additionalVoiceMinutes;
        console.log('Using additionalVoiceMinutes from validatedResults:', additionalVoiceMinutes);
      } 
      // Check calculator inputs callVolume
      else if (calculatorInputsData && typeof calculatorInputsData.callVolume === 'number') {
        additionalVoiceMinutes = calculatorInputsData.callVolume;
        console.log('Using callVolume as additionalVoiceMinutes:', additionalVoiceMinutes);
      }
      // Handle string values in callVolume
      else if (calculatorInputsData && typeof calculatorInputsData.callVolume === 'string' && calculatorInputsData.callVolume !== '') {
        additionalVoiceMinutes = parseInt(calculatorInputsData.callVolume, 10) || 0;
        console.log('Parsed callVolume string as additionalVoiceMinutes:', additionalVoiceMinutes);
      }
      
      // Inject the additionalVoiceMinutes into validated results to ensure it's used in PDF generation
      validatedResults.additionalVoiceMinutes = additionalVoiceMinutes;
      
      console.log('Final additionalVoiceMinutes value being used:', additionalVoiceMinutes);
      
      // Determine tier and AI type display names
      const tierName = getTierName(validatedResults.tierKey);
      const aiType = getAiTypeName(validatedResults.aiType);
      
      // Generate the PDF using the stored calculator results
      const doc = generatePDF({
        contactInfo: report.contact_name || lead.name || 'Valued Client',
        companyName: report.company_name || lead.company_name || 'Your Company',
        email: report.email || lead.email || 'client@example.com',
        phoneNumber: report.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: validatedResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
        includedVoiceMinutes: validatedResults.includedVoiceMinutes || 600,
        businessSuggestions: getBusinessSuggestions(),
        aiPlacements: getAiPlacements(),
        tierName: tierName,
        aiType: aiType
      });
      
      // Save the PDF locally
      doc.save(fileName);
      console.log('PDF generated and saved locally as:', fileName);
      
      // Also upload to Supabase storage
      try {
        // Get the PDF as binary data
        const pdfBlob = await docToBlob(doc);
        
        // Upload to Supabase storage
        const storageResponse = await uploadPdfToStorage(report.id, pdfBlob);
        
        if (storageResponse) {
          console.log('PDF successfully uploaded to Supabase storage at:', storageResponse);
        }
      } catch (uploadError) {
        console.error('Error uploading PDF to storage:', uploadError);
        // Don't throw the error, as we've already given the user the local download
      }
      
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded.",
        duration: 1000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF from report data');
    }
  };
  
  // Helper function to parse JSON if needed
  const ensureJsonParsed = (data: any) => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return data;
      }
    }
    return data;
  };
  
  // Helper function to get tier name display
  const getTierName = (tierKey: string) => {
    return tierKey === 'starter' ? 'Starter Plan' : 
           tierKey === 'growth' ? 'Growth Plan' : 
           tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan';
  };
  
  // Helper function to get AI type display name
  const getAiTypeName = (aiType: string) => {
    return aiType === 'chatbot' ? 'Text Only' : 
           aiType === 'voice' ? 'Basic Voice' : 
           aiType === 'conversationalVoice' ? 'Conversational Voice' : 
           aiType === 'both' ? 'Text & Basic Voice' : 
           aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
  };
  
  // Helper function to convert jsPDF doc to Blob
  const docToBlob = async (doc: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const pdfOutput = doc.output('blob');
        resolve(pdfOutput);
      } catch (e) {
        reject(e);
      }
    });
  };
  
  // Helper function to upload PDF to Supabase storage
  const uploadPdfToStorage = async (reportId: string, pdfBlob: Blob): Promise<string | null> => {
    try {
      // Upload the PDF file
      const filePath = `${reportId}.pdf`;
      console.log('Uploading PDF to storage path:', filePath);
      
      const { data, error } = await supabase.storage
        .from('reports')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600'
        });
      
      if (error) {
        console.error('Error uploading to storage:', error);
        return null;
      }
      
      // Get the public URL
      const { data: urlData } = await supabase.storage
        .from('reports')
        .getPublicUrl(filePath);
      
      console.log('Storage upload successful, public URL:', urlData?.publicUrl);
      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Unexpected error in upload process:', error);
      return null;
    }
  };
  
  // Return standard business suggestions for the report
  const getBusinessSuggestions = () => [
    {
      title: "Automate Common Customer Inquiries",
      description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
    },
    {
      title: "Enhance After-Hours Support",
      description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
    },
    {
      title: "Streamline Onboarding Process",
      description: "Use AI assistants to guide new customers through product setup and initial questions."
    }
  ];
  
  // Return standard AI placements for the report
  const getAiPlacements = () => [
    {
      role: "Front-line Customer Support",
      capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
    },
    {
      role: "Technical Troubleshooting",
      capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
    },
    {
      role: "Sales Assistant",
      capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
    }
  ];
  
  return {
    isLoading,
    handleDownloadReport
  };
};
