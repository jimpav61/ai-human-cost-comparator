
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
      
      // Check if lead ID exists
      if (!lead.id) {
        throw new Error("Lead ID is missing");
      }
      
      // First, try to find the report in the database
      const reportResults = await findReportForLead(lead);
      
      if (reportResults && reportResults.length > 0) {
        const report = reportResults[0]; // Use the first match
        
        // Check if we have a stored PDF file for this report
        if (report.pdf_url) {
          console.log('SUCCESS: Found stored PDF file, downloading directly:', report.pdf_url);
          
          // Trigger direct download of the PDF using the URL
          const link = document.createElement('a');
          link.href = report.pdf_url;
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
          
          return;
        }
        
        // If no stored PDF is found, fall back to generating it from the saved data
        console.log('No stored PDF found, generating from saved report data');
        await generateAndDownloadPDF(report, lead);
        return;
      }
      
      // If we get here, no reports were found using any method
      console.error('All search approaches failed. No reports found for lead:', lead.id);
      
      toast({
        title: "No Report Available",
        description: "No report was found for this lead. Please generate a report first.",
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
  
  // Helper function to find reports for a lead
  const findReportForLead = async (lead: Lead) => {
    // Try multiple approaches to find reports for this lead - for maximum reliability
    console.log('Searching for reports for lead:', lead.id);
    const searchResults = [];
    
    // First approach: Try by lead_id (direct match)
    console.log('Approach 1: Searching for reports with lead_id =', lead.id);
    const { data: directMatches, error: directError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('lead_id', lead.id);
    
    if (directError) {
      console.error('Error in direct lead_id search:', directError);
    }
    
    if (directMatches && directMatches.length > 0) {
      console.log('SUCCESS: Found reports through direct lead_id match:', directMatches.length);
      searchResults.push(...directMatches);
    }
    
    // Second approach: Try by report ID = lead ID (legacy approach)
    console.log('Approach 2: Checking if lead ID matches any report ID');
    const { data: idMatch, error: idError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', lead.id)
      .maybeSingle();
    
    if (idError) {
      console.error('Error in report ID search:', idError);
    }
    
    if (idMatch) {
      console.log('SUCCESS: Found report where ID matches lead ID');
      if (!searchResults.some(r => r.id === idMatch.id)) {
        searchResults.push(idMatch);
      }
    }
    
    // Third approach: Try by email
    console.log('Approach 3: Searching for reports with email =', lead.email);
    const { data: emailMatches, error: emailError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('email', lead.email);
    
    if (emailError) {
      console.error('Error in email search:', emailError);
    }
    
    if (emailMatches && emailMatches.length > 0) {
      console.log('SUCCESS: Found reports through email match:', emailMatches.length);
      emailMatches.forEach(match => {
        if (!searchResults.some(r => r.id === match.id)) {
          searchResults.push(match);
        }
      });
    }
    
    // Fourth approach: Try by company name
    if (lead.company_name) {
      console.log('Approach 4: Searching for reports with company_name similar to', lead.company_name);
      const { data: companyMatches, error: companyError } = await supabase
        .from('generated_reports')
        .select('*')
        .ilike('company_name', `%${lead.company_name}%`);
      
      if (companyError) {
        console.error('Error in company name search:', companyError);
      }
      
      if (companyMatches && companyMatches.length > 0) {
        console.log('SUCCESS: Found reports through company name match:', companyMatches.length);
        companyMatches.forEach(match => {
          if (!searchResults.some(r => r.id === match.id)) {
            searchResults.push(match);
          }
        });
      }
    }
    
    // Check for stored PDF files for each report
    for (const report of searchResults) {
      try {
        const pdfFileName = `reports/${report.id}.pdf`;
        
        // Check if file exists in storage - fixed API call
        const { data } = await supabase.storage
          .from('reports')
          .getPublicUrl(pdfFileName);
        
        if (data) {
          console.log(`Found stored PDF for report ${report.id}`);
          report.pdf_url = data.publicUrl;
        }
      } catch (fileCheckError) {
        console.error("Error checking for PDF file:", fileCheckError);
      }
    }
    
    return searchResults;
  };
  
  // Helper function to generate and download PDF from a report
  const generateAndDownloadPDF = async (report: any, lead: Lead) => {
    try {
      console.log('Generating PDF from report:', {
        reportId: report.id, 
        leadId: report.lead_id,
        company: report.company_name
      });
      
      // Generate safe filename for the report
      const safeCompanyName = getSafeFileName(lead);
      const fileName = `${safeCompanyName}-ChatSites-ROI-Report.pdf`;
      
      // Parse calculator results from JSON string if needed
      let calculatorResultsData;
      if (typeof report.calculator_results === 'string') {
        try {
          calculatorResultsData = JSON.parse(report.calculator_results);
        } catch (e) {
          console.error('Error parsing calculator_results JSON:', e);
          calculatorResultsData = report.calculator_results;
        }
      } else {
        calculatorResultsData = report.calculator_results;
      }
      
      // Validate and ensure the calculator results have the correct structure
      const validatedResults = ensureCompleteCalculatorResults(calculatorResultsData);
      
      // Generate the PDF using the stored calculator results
      const doc = generatePDF({
        contactInfo: report.contact_name || lead.name || 'Valued Client',
        companyName: report.company_name || lead.company_name || 'Your Company',
        email: report.email || lead.email || 'client@example.com',
        phoneNumber: report.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: validatedResults,
        additionalVoiceMinutes: validatedResults.additionalVoiceMinutes || 0,
        includedVoiceMinutes: validatedResults.includedVoiceMinutes || 600,
        businessSuggestions: [
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
        ],
        aiPlacements: [
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
        ],
        tierName: validatedResults.tierKey === 'starter' ? 'Starter Plan' : 
                 validatedResults.tierKey === 'growth' ? 'Growth Plan' : 
                 validatedResults.tierKey === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: validatedResults.aiType === 'chatbot' ? 'Text Only' : 
               validatedResults.aiType === 'voice' ? 'Basic Voice' : 
               validatedResults.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
               validatedResults.aiType === 'both' ? 'Text & Basic Voice' : 
               validatedResults.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save the PDF with the proper name - fixed output type
      doc.save(fileName);
      console.log('Report download successful, saved as:', fileName);
      
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
  
  return {
    isLoading,
    handleDownloadReport
  };
};
