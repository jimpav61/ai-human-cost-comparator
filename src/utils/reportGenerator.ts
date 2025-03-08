
import { generatePDF } from "@/components/calculator/pdf";
import { Lead } from "@/types/leads";
import { getSafeFileName } from "@/components/admin/document-generator/hooks/report-generator/saveReport";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SharedResults } from "@/components/calculator/shared/types";

/**
 * Checks if a lead has calculator results and can generate a report
 */
const canGenerateReport = (lead: Lead): boolean => {
  return (
    lead && 
    lead.calculator_results && 
    typeof lead.calculator_results === 'object' &&
    Object.keys(lead.calculator_results).length > 0
  );
};

/**
 * Shared utility function that generates and downloads a PDF report
 * for a lead using the same generator regardless of whether it's called
 * from the frontend or admin panel
 */
export const generateAndDownloadReport = async (lead: Lead) => {
  try {
    console.log('[SHARED REPORT] Generating report for lead:', lead);
    
    // Check if lead exists
    if (!lead) {
      throw new Error("Lead data is missing");
    }

    // First check if there's a saved report in the database
    console.log('[SHARED REPORT] Checking for existing saved report for lead ID:', lead.id);
    
    // Try multiple methods to find a report
    const { data: exactReport, error: exactError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', lead.id)
      .maybeSingle();
      
    if (exactError) {
      console.error('[SHARED REPORT] Error fetching exact report:', exactError);
    }
    
    // If we have an exact match by ID
    if (exactReport) {
      console.log('[SHARED REPORT] Found existing report by ID match:', exactReport);
      
      // Process the calculatorInputs and calculatorResults, ensuring proper typing
      const calculatorInputs = typeof exactReport.calculator_inputs === 'string'
        ? JSON.parse(exactReport.calculator_inputs as string)
        : (exactReport.calculator_inputs as Record<string, any>);
        
      const calculatorResults = typeof exactReport.calculator_results === 'string'
        ? JSON.parse(exactReport.calculator_results as string)
        : (exactReport.calculator_results as SharedResults);
      
      // Generate PDF using the saved report data
      const doc = generatePDF({
        contactInfo: exactReport.contact_name || lead.name || 'Valued Client',
        companyName: exactReport.company_name || lead.company_name || 'Your Company',
        email: exactReport.email || lead.email || 'client@example.com',
        phoneNumber: exactReport.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults as SharedResults,
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: calculatorInputs?.aiTier === 'starter' ? 'Starter Plan' : 
                calculatorInputs?.aiTier === 'growth' ? 'Growth Plan' : 
                calculatorInputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: calculatorInputs?.aiType === 'chatbot' ? 'Text Only' : 
                calculatorInputs?.aiType === 'voice' ? 'Basic Voice' : 
                calculatorInputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorInputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorInputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save file with proper naming
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Success",
        description: `Saved report for ${lead.company_name || 'Client'} downloaded successfully`,
        variant: "default",
      });
      
      return true;
    }
    
    // Try finding by email if no direct ID match
    const { data: emailReports, error: emailError } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('email', lead.email);
      
    if (emailError) {
      console.error('[SHARED REPORT] Error fetching report by email:', emailError);
    }
    
    // If we found a report by email
    if (emailReports && emailReports.length > 0) {
      console.log('[SHARED REPORT] Found existing report by email match:', emailReports[0]);
      
      const reportByEmail = emailReports[0];
      
      // Process the calculatorInputs and calculatorResults, ensuring proper typing
      const calculatorInputs = typeof reportByEmail.calculator_inputs === 'string'
        ? JSON.parse(reportByEmail.calculator_inputs as string)
        : (reportByEmail.calculator_inputs as Record<string, any>);
        
      const calculatorResults = typeof reportByEmail.calculator_results === 'string'
        ? JSON.parse(reportByEmail.calculator_results as string)
        : (reportByEmail.calculator_results as SharedResults);
      
      // Generate PDF using the saved report data
      const doc = generatePDF({
        contactInfo: reportByEmail.contact_name || lead.name || 'Valued Client',
        companyName: reportByEmail.company_name || lead.company_name || 'Your Company',
        email: reportByEmail.email || lead.email || 'client@example.com',
        phoneNumber: reportByEmail.phone_number || lead.phone_number || '',
        industry: lead.industry || 'Other',
        employeeCount: Number(lead.employee_count) || 5,
        results: calculatorResults as SharedResults,
        additionalVoiceMinutes: calculatorInputs?.callVolume || 0,
        includedVoiceMinutes: calculatorInputs?.aiTier === 'starter' ? 0 : 600,
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
        tierName: calculatorInputs?.aiTier === 'starter' ? 'Starter Plan' : 
                calculatorInputs?.aiTier === 'growth' ? 'Growth Plan' : 
                calculatorInputs?.aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan',
        aiType: calculatorInputs?.aiType === 'chatbot' ? 'Text Only' : 
                calculatorInputs?.aiType === 'voice' ? 'Basic Voice' : 
                calculatorInputs?.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                calculatorInputs?.aiType === 'both' ? 'Text & Basic Voice' : 
                calculatorInputs?.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only'
      });
      
      // Save file with proper naming
      const safeCompanyName = getSafeFileName(lead);
      doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
      
      toast({
        title: "Success",
        description: `Saved report for ${lead.company_name || 'Client'} downloaded successfully`,
        variant: "default",
      });
      
      return true;
    }
    
    // If no saved report found anywhere, check if we can generate from current lead data
    if (!canGenerateReport(lead)) {
      throw new Error("This lead has no saved calculation results. Please contact support if you believe this is an error.");
    }

    // Use the saved calculator inputs and results
    const aiTier = lead.calculator_inputs?.aiTier || 'growth';
    const aiType = lead.calculator_inputs?.aiType || 'chatbot';
    
    // Format tier and AI type display names
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
                    
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                          aiType === 'voice' ? 'Basic Voice' : 
                          aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                          aiType === 'both' ? 'Text & Basic Voice' : 
                          aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
    
    // Generate the PDF
    const doc = generatePDF({
      contactInfo: lead.name || 'Valued Client',
      companyName: lead.company_name || 'Your Company',
      email: lead.email || 'client@example.com',
      phoneNumber: lead.phone_number || '',
      industry: lead.industry || 'Other',
      employeeCount: Number(lead.employee_count) || 5,
      results: lead.calculator_results as SharedResults,
      additionalVoiceMinutes: lead.calculator_inputs?.callVolume || 0,
      includedVoiceMinutes: aiTier === 'starter' ? 0 : 600,
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
      tierName: tierName,
      aiType: aiTypeDisplay
    });
    
    // Save report to database for future retrieval
    const reportData = {
      id: lead.id, // Use lead ID as report ID for easy lookup
      contact_name: lead.name,
      company_name: lead.company_name,
      email: lead.email,
      phone_number: lead.phone_number || null,
      calculator_inputs: lead.calculator_inputs,
      calculator_results: lead.calculator_results,
      report_date: new Date().toISOString()
    };
    
    console.log('[SHARED REPORT] Saving report to database:', reportData);
    
    // Save to database in background
    supabase
      .from('generated_reports')
      .upsert([reportData as any])
      .then(({ error }) => {
        if (error) {
          console.error('[SHARED REPORT] Error saving report to database:', error);
        } else {
          console.log('[SHARED REPORT] Report saved to database successfully');
        }
      });
    
    // Save file with proper naming
    const safeCompanyName = getSafeFileName(lead);
    doc.save(`${safeCompanyName}-ChatSites-ROI-Report.pdf`);
    
    toast({
      title: "Success",
      description: `Report for ${lead.company_name || 'Client'} downloaded successfully`,
      variant: "default",
    });
    
    return true;
  } catch (error) {
    console.error('[SHARED REPORT] Report generation error:', error);
    toast({
      title: "Error",
      description: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return false;
  }
};
