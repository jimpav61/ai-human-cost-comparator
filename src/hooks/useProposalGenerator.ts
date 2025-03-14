
import { useState } from 'react';
import { Lead } from '@/types/leads';
import { generateProposal } from '@/utils/proposalGenerator';
import { supabase } from '@/integrations/supabase/client';

export function useProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [proposalPdf, setProposalPdf] = useState('');
  const [generationSuccess, setGenerationSuccess] = useState(false);

  const generateProposalDoc = async (lead: Lead): Promise<string> => {
    try {
      setGenerating(true);
      setGenerationError('');
      setGenerationSuccess(false);

      // Log the lead data for debugging
      console.log('Generating proposal for lead:', {
        id: lead.id,
        calculatorResults: lead.calculator_results
      });

      // Generate proposal data using our utility
      const proposalData = generateProposal(lead);

      // Call the Supabase Edge Function to generate PDF
      console.log('Calling generate-proposal edge function with lead data...');
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { 
          lead: { ...lead, proposalData },
          mode: "preview",
          returnContent: false
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      // Verify the data structure returned from the edge function
      console.log('Response from generate-proposal edge function:', data);
      
      if (!data || !data.pdf) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response from proposal generator');
      }

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
    generateProposal: generateProposalDoc
  };
}
