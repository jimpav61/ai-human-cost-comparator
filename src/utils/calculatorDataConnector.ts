
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/leads";
import { CalculationResults } from "@/hooks/calculator/types";
import { toJson, ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

/**
 * Saves calculator results to the lead record in Supabase
 * This ensures the exact calculator values are persisted
 */
export async function saveCalculatorResults(leadId: string, calculatorResults: CalculationResults) {
  if (!leadId || !calculatorResults) {
    console.error('Missing required data for saving calculator results', { leadId, calculatorResults });
    throw new Error('Missing required data for saving calculator results');
  }

  try {
    // Clone the calculator results to avoid reference issues
    const resultsToSave = JSON.parse(JSON.stringify(calculatorResults));
    
    // Save to Supabase
    const { error } = await supabase
      .from('leads')
      .update({
        calculator_results: toJson(resultsToSave),
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    if (error) throw error;
    
    console.log(`Calculator results saved for lead ${leadId}`);
    return true;
  } catch (error) {
    console.error('Error saving calculator results:', error);
    throw error;
  }
}

/**
 * Retrieves calculator results for a lead
 * This ensures we're using the exact saved values
 */
export async function getCalculatorResults(leadId: string): Promise<CalculationResults | null> {
  if (!leadId) {
    console.error('Missing lead ID for retrieving calculator results');
    throw new Error('Missing lead ID');
  }

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('calculator_results')
      .eq('id', leadId)
      .single();
    
    if (error) throw error;
    
    if (!lead || !lead.calculator_results) {
      console.warn(`No calculator results found for lead ${leadId}`);
      return null;
    }
    
    // Ensure we have complete calculator results
    return ensureCompleteCalculatorResults(lead.calculator_results);
  } catch (error) {
    console.error('Error retrieving calculator results:', error);
    throw error;
  }
}

/**
 * Gets a complete lead with validated calculator results
 */
export async function getLeadWithCalculatorResults(leadId: string): Promise<Lead | null> {
  if (!leadId) {
    console.error('Missing lead ID');
    throw new Error('Missing lead ID');
  }

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (error) throw error;
    
    if (!lead) {
      console.error(`No lead found with ID ${leadId}`);
      return null;
    }

    // Create a properly typed lead object
    const typedLead: Lead = {
      ...lead,
      calculator_results: ensureCompleteCalculatorResults(lead.calculator_results || {})
    };
    
    return typedLead;
  } catch (error) {
    console.error('Error retrieving lead:', error);
    throw error;
  }
}

/**
 * Generates a proposal using the saved calculator results by calling the edge function
 */
export async function generateProposalFromSavedData(leadId: string): Promise<string | null> {
  try {
    // Get the lead with calculator results
    const lead = await getLeadWithCalculatorResults(leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    if (!lead.calculator_results) {
      throw new Error('No calculator results found for this lead');
    }
    
    console.log('Generating proposal with lead data:', JSON.stringify(lead, null, 2));
    
    // Call the edge function with the lead data
    const { data, error } = await supabase.functions.invoke('generate-proposal', {
      body: { lead }
    });
    
    if (error) throw error;
    
    if (!data || !data.pdf) {
      throw new Error('Failed to generate proposal PDF');
    }
    
    console.log('Proposal generated successfully');
    
    // Update the lead to mark proposal as sent
    await supabase
      .from('leads')
      .update({ 
        proposal_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    return data.pdf;
  } catch (error) {
    console.error('Error generating proposal from saved data:', error);
    throw error;
  }
}
