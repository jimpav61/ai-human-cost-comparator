
import { supabase } from "@/integrations/supabase/client";
import { CalculatorInputs, CalculationResults } from "@/hooks/calculator/types";
import { Lead } from "@/types/leads";
import { Json } from "@/integrations/supabase/types";
import { ensureCalculatorInputs, ensureCompleteCalculatorResults } from "@/hooks/calculator/supabase-types";

/**
 * Saves calculator results to the lead document in Supabase
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
        calculator_results: resultsToSave,
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
      .maybeSingle();
    
    if (error) throw error;
    
    if (!lead || !lead.calculator_results) {
      console.warn(`No calculator results found for lead ${leadId}`);
      return null;
    }
    
    // Convert the JSON data to CalculationResults type
    return ensureCompleteCalculatorResults(lead.calculator_results);
  } catch (error) {
    console.error('Error retrieving calculator results:', error);
    throw error;
  }
}

/**
 * Safely convert Json type from Supabase to CalculatorInputs
 */
function convertJsonToCalculatorInputs(jsonData: Json): CalculatorInputs {
  // Use the ensureCalculatorInputs helper from supabase-types
  return ensureCalculatorInputs(typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData);
}

/**
 * Retrieves a lead with properly typed calculator data
 */
export async function getLeadWithCalculatorData(leadId: string): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;
    
    // Convert the JSON data to the correct types
    const lead: Lead = {
      id: data.id,
      name: data.name,
      company_name: data.company_name,
      email: data.email,
      phone_number: data.phone_number,
      website: data.website || '',
      industry: data.industry || '',
      employee_count: data.employee_count || 0,
      calculator_inputs: convertJsonToCalculatorInputs(data.calculator_inputs),
      calculator_results: ensureCompleteCalculatorResults(data.calculator_results),
      proposal_sent: data.proposal_sent || false,
      created_at: data.created_at || '',
      updated_at: data.updated_at || '',
      form_completed: data.form_completed || false
    };
    
    return lead;
  } catch (error) {
    console.error('Error retrieving lead with calculator data:', error);
    throw error;
  }
}

/**
 * Generates a proposal using the saved calculator results
 */
export async function generateProposalFromSavedData(leadId: string) {
  try {
    // Get the lead with proper type conversions
    const lead = await getLeadWithCalculatorData(leadId);
    
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    if (!lead.calculator_results) {
      throw new Error('No calculator results found for this lead');
    }
    
    // Call the proposal generator API with the retrieved data
    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lead }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate proposal');
    }
    
    const proposalData = await response.json();
    
    // Update the lead to indicate proposal was generated
    await supabase
      .from('leads')
      .update({
        proposal_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    return proposalData;
  } catch (error) {
    console.error('Error generating proposal from saved data:', error);
    throw error;
  }
}

/**
 * Debug utility to log calculator results at key points
 */
export function debugLogCalculatorResults(stage: string, calculatorResults: CalculationResults) {
  console.log(`=== CALCULATOR RESULTS AT ${stage.toUpperCase()} ===`);
  console.log(JSON.stringify({
    tierKey: calculatorResults.tierKey,
    setupFee: calculatorResults.aiCostMonthly?.setupFee,
    basePriceMonthly: calculatorResults.basePriceMonthly,
    humanCostMonthly: calculatorResults.humanCostMonthly,
    monthlySavings: calculatorResults.monthlySavings,
    additionalVoiceCost: calculatorResults.aiCostMonthly?.voice
  }, null, 2));
}
