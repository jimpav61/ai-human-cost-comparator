
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";
import { generatePDF } from "@/components/calculator/pdf";
import { supabase } from "@/integrations/supabase/client";
import { getSafeFileName } from "@/utils/report/validation";
import { verifyReportsBucket, createReportsBucketPolicies } from "@/utils/report/bucketUtils";

// Helper function to ensure JSON is parsed
export const ensureJsonParsed = (data: any) => {
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
export const getTierName = (tierKey: string) => {
  return tierKey === 'starter' ? 'Starter Plan' : 
         tierKey === 'growth' ? 'Growth Plan' : 
         tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan';
};

// Helper function to get AI type display name
export const getAiTypeName = (aiType: string) => {
  return aiType === 'chatbot' ? 'Text Only' : 
         aiType === 'voice' ? 'Basic Voice' : 
         aiType === 'conversationalVoice' ? 'Conversational Voice' : 
         aiType === 'both' ? 'Text & Basic Voice' : 
         aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
};

// Return standard business suggestions for the report
export const getBusinessSuggestions = () => [
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
export const getAiPlacements = () => [
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

// Helper function to convert jsPDF doc to Blob
export const docToBlob = async (doc: any): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const pdfOutput = doc.output('blob');
      resolve(pdfOutput);
    } catch (e) {
      reject(e);
    }
  });
};

// Generate PDF from report data and download it
export const generateAndUploadPDF = async (report: any, lead: Lead) => {
  try {
    console.log('Generating PDF for report:', {
      reportId: report.id, 
      leadId: report.lead_id,
      company: lead.company_name
    });
    
    // CRITICAL: First verify and create the reports bucket if needed
    const bucketSuccess = await verifyReportsBucket();
    if (!bucketSuccess) {
      console.error("CRITICAL: Reports bucket could not be verified or created");
      toast({
        title: "Storage Error",
        description: "There was an issue with the storage configuration. PDF may not be saved online.",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      console.log("Reports bucket verified successfully");
      // Also verify/create bucket policies
      await createReportsBucketPolicies();
    }
    
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
    
    // CRITICAL: Directly use call volume from calculator inputs for voice minutes
    let additionalVoiceMinutes = 0;
    
    // First priority: Look for callVolume in calculator_inputs
    if (calculatorInputsData && typeof calculatorInputsData.callVolume === 'number') {
      additionalVoiceMinutes = calculatorInputsData.callVolume;
      console.log('Using callVolume from inputs:', additionalVoiceMinutes);
    } 
    // Second priority: Parse string value if present
    else if (calculatorInputsData && typeof calculatorInputsData.callVolume === 'string' && calculatorInputsData.callVolume !== '') {
      additionalVoiceMinutes = parseInt(calculatorInputsData.callVolume, 10) || 0;
      console.log('Parsed callVolume string as:', additionalVoiceMinutes);
    }
    // Third priority: Check additionalVoiceMinutes in validatedResults
    else if (typeof validatedResults.additionalVoiceMinutes === 'number') {
      additionalVoiceMinutes = validatedResults.additionalVoiceMinutes;
      console.log('Using additionalVoiceMinutes from results:', additionalVoiceMinutes);
    }
    
    // IMPORTANT: Always get the tier and AI type correctly
    const tierKey = validatedResults.tierKey || 'growth';
    const aiTypeKey = validatedResults.aiType || 'both';
    
    // Ensure includedVoiceMinutes is set correctly based on tier
    const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
    
    console.log('Final values for PDF generation:', {
      additionalVoiceMinutes,
      includedVoiceMinutes,
      tierKey,
      aiTypeKey
    });
    
    // Determine tier and AI type display names
    const tierName = getTierName(tierKey);
    const aiType = getAiTypeName(aiTypeKey);
    
    // Generate the PDF using the EXACT SAME parameters for both download and storage
    const doc = generatePDF({
      contactInfo: report.contact_name || lead.name || 'Valued Client',
      companyName: report.company_name || lead.company_name || 'Your Company',
      email: report.email || lead.email || 'client@example.com',
      phoneNumber: report.phone_number || lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: {
        ...validatedResults,
        additionalVoiceMinutes: additionalVoiceMinutes,
        includedVoiceMinutes: includedVoiceMinutes
      },
      additionalVoiceMinutes: additionalVoiceMinutes,
      includedVoiceMinutes: includedVoiceMinutes,
      businessSuggestions: getBusinessSuggestions(),
      aiPlacements: getAiPlacements(),
      tierName: tierName,
      aiType: aiType
    });
    
    // First - save the exact document locally for immediate download
    doc.save(fileName);
    console.log('PDF generated and saved locally as:', fileName);
    
    // Then - DIRECTLY upload the same document to storage
    try {
      console.log('Uploading the exact same PDF to Supabase storage...');
      console.log('Report ID (used as filename in storage):', report.id);
      
      // Get blob from the document once for both database and storage
      const pdfBlob = await docToBlob(doc);
      console.log('PDF blob size:', pdfBlob.size, 'bytes');
      
      // CRITICAL - Insert the report into the database first
      const { data: dbData, error: dbError } = await supabase
        .from('generated_reports')
        .upsert({
          id: report.id,
          lead_id: report.lead_id,
          report_date: report.report_date,
          calculator_inputs: report.calculator_inputs,
          calculator_results: report.calculator_results,
          company_name: lead.company_name,
          contact_name: lead.name,
          email: lead.email,
          phone_number: lead.phone_number
        })
        .select('id');
    
      if (dbError) {
        console.error('Error saving report to database:', dbError);
      } else {
        console.log('Report saved to database successfully:', dbData);
      }
    
      // Upload to Supabase storage with the report ID as the filename
      const storageFilePath = `${report.id}.pdf`;
      console.log('Uploading to storage path:', storageFilePath);
      
      // Add debugging to check authentication status before upload
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current auth session:', session ? 'Authenticated' : 'Not authenticated');
      
      // Try upload with more detailed error handling
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(storageFilePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error('Error uploading PDF to storage:', uploadError);
          console.log('Upload error details:', {
            message: uploadError.message,
            name: uploadError.name,
            // Remove properties that don't exist on StorageError type
          });
          
          // More specific error handling for common errors
          if (uploadError.message.includes("The resource already exists")) {
            console.log('File already exists in storage. This is not an error.');
            
            // Get the public URL for the existing file
            const { data: urlData } = await supabase.storage
              .from('reports')
              .getPublicUrl(storageFilePath);
              
            console.log('Existing file URL:', urlData?.publicUrl);
          } else if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
            console.error('CRITICAL: The storage bucket "reports" does not exist - attempting to create it now');
            
            // Last resort: create bucket directly
            const { error: createBucketError } = await supabase.storage.createBucket('reports', {
              public: true
            });
            
            if (createBucketError) {
              console.error('Failed to create reports bucket:', createBucketError);
            } else {
              console.log('Created reports bucket successfully, retrying upload');
              // Retry the upload after bucket creation
              const { data: retryData, error: retryError } = await supabase.storage
                .from('reports')
                .upload(storageFilePath, pdfBlob, {
                  contentType: 'application/pdf',
                  upsert: true
                });
                
              if (retryError) {
                console.error('Retry upload failed:', retryError);
              } else {
                console.log('Retry upload succeeded:', retryData);
              }
            }
          }
        } else {
          console.log('PDF successfully uploaded to storage:', uploadData?.path);
          
          // Get the public URL
          const { data: urlData } = await supabase.storage
            .from('reports')
            .getPublicUrl(storageFilePath);
            
          console.log('Public URL for uploaded file:', urlData?.publicUrl);
        }
      } catch (uploadError) {
        console.error('Error during storage upload process:', uploadError);
      }
      
      toast({
        title: "Report Downloaded",
        description: "The report has been successfully downloaded and saved.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading to storage:', error);
      toast({
        title: "Storage Error",
        description: "The report was downloaded but could not be saved online.",
        variant: "destructive",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast({
      title: "Error",
      description: "Failed to generate PDF from report data.",
      variant: "destructive",
      duration: 3000,
    });
  }
};
