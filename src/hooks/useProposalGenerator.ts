
import { useState } from 'react';
import { Lead } from '@/types/leads';
import { generateProposal } from '@/utils/proposalGenerator';
import { supabase } from '@/integrations/supabase/client';
import { CalculatorInputs, CalculationResults } from '@/hooks/calculator/types';
import { getDefaultCalculatorInputs, getDefaultCalculationResults } from '@/hooks/calculator/supabase-types';

export function useProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [proposalPdf, setProposalPdf] = useState('');
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // Debugging utility to check PDF content format
  const diagnosePdfFormat = async (pdfContent: string) => {
    try {
      // Log general characteristics about the content
      console.log('PDF DIAGNOSTICS:', {
        contentType: typeof pdfContent,
        contentLength: pdfContent.length,
        firstFewChars: pdfContent.substring(0, 50),
        lastFewChars: pdfContent.substring(pdfContent.length - 50),
        isPdfHeader: pdfContent.startsWith('%PDF-'),
        isBase64: /^[A-Za-z0-9+/=]+$/.test(pdfContent) && !pdfContent.includes(' '),
        isDataUrl: pdfContent.startsWith('data:application/pdf;base64,'),
        isJsonString: pdfContent.startsWith('{') && pdfContent.endsWith('}'),
      });

      // Try to check if it's a JSON object with PDF content
      if (pdfContent.startsWith('{')) {
        try {
          const jsonObj = JSON.parse(pdfContent);
          console.log('JSON PARSED CONTENT:', {
            hasPdfProperty: !!jsonObj.pdf,
            pdfPropertyType: jsonObj.pdf ? typeof jsonObj.pdf : 'N/A',
            pdfPropertyLength: jsonObj.pdf ? jsonObj.pdf.length : 0,
            pdfPropertyStart: jsonObj.pdf ? jsonObj.pdf.substring(0, 30) : '',
          });
        } catch (e) {
          console.log('Not valid JSON:', e);
        }
      }
      
      return {
        success: true,
        format: pdfContent.startsWith('%PDF-') ? 'raw-pdf' : 
                /^[A-Za-z0-9+/=]+$/.test(pdfContent) ? 'base64' : 
                pdfContent.startsWith('data:') ? 'data-url' :
                pdfContent.startsWith('{') ? 'json' : 'unknown'
      };
    } catch (error) {
      console.error('Error diagnosing PDF format:', error);
      return { success: false, error };
    }
  };

  const generateProposalDoc = async (lead: Lead): Promise<string> => {
    try {
      setGenerating(true);
      setGenerationError('');
      setGenerationSuccess(false);

      // Log the lead data for debugging
      console.log('Generating proposal for lead:', {
        id: lead.id,
        calculatorResults: JSON.stringify(lead.calculator_results, null, 2)
      });

      // Ensure calculator_inputs and calculator_results are properly set with default values
      // that match the required TypeScript interfaces
      const safetyLead = {
        ...lead,
        calculator_inputs: lead.calculator_inputs && typeof lead.calculator_inputs === 'object' && Object.keys(lead.calculator_inputs).length > 0
          ? lead.calculator_inputs as CalculatorInputs
          : getDefaultCalculatorInputs(),
        calculator_results: lead.calculator_results && typeof lead.calculator_results === 'object' && Object.keys(lead.calculator_results).length > 0
          ? lead.calculator_results as CalculationResults
          : getDefaultCalculationResults()
      };

      // Generate proposal data using our utility
      const proposalData = generateProposal(safetyLead);

      // Call the Supabase Edge Function to generate PDF
      console.log('Calling generate-proposal edge function with lead data...');
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { 
          lead: { ...safetyLead, proposalData },
          mode: "preview",
          returnContent: false,
          // Add a flag to trigger detailed diagnostics
          debug: true
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      // Verify the data structure returned from the edge function
      console.log('Response from generate-proposal edge function:', data);
      
      if (!data || !data.pdf) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from proposal generator: No PDF data returned');
      }

      console.log('PDF data received, length:', data.pdf.length);
      console.log('PDF data sample (first 30 chars):', data.pdf.substring(0, 30));
      
      // Run diagnostics on the received PDF content
      await diagnosePdfFormat(data.pdf);

      setProposalPdf(data.pdf);
      setGenerationSuccess(true);
      return data.pdf;

    } catch (error) {
      console.error('Error generating proposal:', error);
      const message = error instanceof Error ? error.message : 'Unknown error generating proposal';
      setGenerationError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  };

  return {
    generating,
    generationError,
    proposalPdf,
    generationSuccess,
    generateProposal: generateProposalDoc,
    diagnosePdfFormat
  };
}
