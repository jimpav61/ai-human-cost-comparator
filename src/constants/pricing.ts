
import { supabase } from "@/integrations/supabase/client";
import type { PricingConfiguration } from '@/types/pricing';

// Default values (used while loading from DB)
export const DEFAULT_AI_RATES = {
  voice: {
    basic: 0.06,
    standard: 0.12,
    premium: 0.25,
  },
  chatbot: {
    basic: { base: 99, perMessage: 0.003 },
    standard: { base: 249, perMessage: 0.005 },
    premium: { base: 499, perMessage: 0.008 }
  }
};

// Human labor costs by role (North American averages in 2025)
export const HUMAN_HOURLY_RATES = {
  customerService: 21.50,
  sales: 28.75,
  technicalSupport: 32.50,
  generalAdmin: 19.25,
};

export const ROLE_LABELS = {
  customerService: "Customer Service",
  sales: "Sales",
  technicalSupport: "Technical Support",
  generalAdmin: "General Admin"
};

export type AIRates = typeof DEFAULT_AI_RATES;

export const fetchPricingConfigurations = async (): Promise<AIRates> => {
  try {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .order('tier');

    if (error) throw error;

    if (!data || data.length === 0) return DEFAULT_AI_RATES;

    const result: AIRates = {
      voice: {
        basic: 0.06,
        standard: 0.12,
        premium: 0.25,
      },
      chatbot: {
        basic: { base: 99, perMessage: 0.003 },
        standard: { base: 249, perMessage: 0.005 },
        premium: { base: 499, perMessage: 0.008 }
      }
    };

    // Update the values from the database
    data.forEach((config: PricingConfiguration) => {
      result.voice[config.tier] = config.voice_per_minute;
      result.chatbot[config.tier] = {
        base: config.chatbot_base_price,
        perMessage: config.chatbot_per_message
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching pricing configurations:', error);
    return DEFAULT_AI_RATES;
  }
};

export const AI_RATES = DEFAULT_AI_RATES;
