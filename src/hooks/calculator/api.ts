
import { DEFAULT_AI_RATES, AIRates } from '@/constants/pricing';
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch pricing configurations from the database
 */
export async function fetchPricingRates(): Promise<AIRates> {
  try {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .order('tier');

    if (error) throw error;

    if (!data || data.length === 0) return DEFAULT_AI_RATES;

    // Start with default rates, then override with database values
    const result: AIRates = JSON.parse(JSON.stringify(DEFAULT_AI_RATES));

    // Update the values from the database
    data.forEach((dbConfig: any) => {
      const config = dbConfig as any;
      const tier = config.tier as 'starter' | 'growth' | 'premium';
      
      if (result.voice[tier] !== undefined) {
        result.voice[tier] = config.voice_per_minute;
      }
      
      if (result.chatbot[tier] !== undefined) {
        // Hard-code the base prices to match exactly what's shown in the plans
        // regardless of what's in the database
        const hardcodedBasePrices = {
          starter: 99,
          growth: 229,
          premium: 429
        };
        
        result.chatbot[tier] = {
          base: hardcodedBasePrices[tier],
          perMessage: tier === 'starter' ? 0 : config.chatbot_per_message,
          setupFee: config.setup_fee || DEFAULT_AI_RATES.chatbot[tier].setupFee,
          annualPrice: config.annual_price || DEFAULT_AI_RATES.chatbot[tier].annualPrice,
          includedVoiceMinutes: 
            tier === 'starter' ? 0 : 600, // Always use 600 for both growth and premium
          additionalVoiceRate: 
            tier === 'starter' ? 0 : 0.12 // Always use 0.12 for additional minutes
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching pricing configurations:', error);
    return DEFAULT_AI_RATES;
  }
}
