
import { supabase } from "@/integrations/supabase/client";
import type { PricingConfiguration, PackageTier } from '@/types/pricing';

// Default values (used while loading from DB)
export const DEFAULT_AI_RATES = {
  voice: {
    starter: 0,
    growth: 0.12,
    premium: 0.12,
  },
  chatbot: {
    starter: { base: 99, perMessage: 0, setupFee: 249, annualPrice: 990, includedVoiceMinutes: 0 },
    growth: { base: 229, perMessage: 0.005, setupFee: 749, annualPrice: 2290, includedVoiceMinutes: 600 },
    premium: { base: 429, perMessage: 0.008, setupFee: 1149, annualPrice: 4290, includedVoiceMinutes: 600 }
  }
};

// Human labor costs by role (North American averages in 2025)
// Updated with more industry-specific rates
export const HUMAN_HOURLY_RATES = {
  customerService: 21.50,
  sales: 28.75,
  technicalSupport: 32.50,
  generalAdmin: 19.25,
};

// Industry-specific hourly rates - these will be applied as multipliers to the base rates
export const INDUSTRY_RATE_MULTIPLIERS: Record<string, number> = {
  "Agriculture": 0.85,
  "Automotive": 1.1,
  "Banking & Finance": 1.5,
  "Construction": 1.05,
  "Consulting": 1.4,
  "Education": 0.9,
  "Entertainment": 1.2,
  "Food & Beverage": 0.8,
  "Government": 1.1,
  "Healthcare": 1.25,
  "Hospitality": 0.75,
  "Information Technology": 1.5,
  "Insurance": 1.3,
  "Legal Services": 1.6,
  "Manufacturing": 1.0,
  "Marketing & Advertising": 1.3,
  "Media & Publishing": 1.15,
  "Mining & Metals": 1.2,
  "Non-Profit": 0.8,
  "Oil & Gas": 1.4,
  "Pharmaceuticals": 1.45,
  "Real Estate": 1.25,
  "Retail": 0.85,
  "Telecommunications": 1.2,
  "Transportation & Logistics": 1.05,
  "Travel & Tourism": 0.9,
  "Utilities": 1.15,
  "Wholesale Distribution": 0.95,
  "Other": 1.0
};

export const ROLE_LABELS = {
  customerService: "Customer Service",
  sales: "Sales",
  technicalSupport: "Technical Support",
  generalAdmin: "General Admin"
};

export const TIER_DESCRIPTIONS = {
  starter: "Perfect for businesses looking for basic text-based customer interaction.",
  growth: "Ideal for businesses that want to add basic voice capabilities with scripted responses.",
  premium: "For businesses that need advanced conversational voice capabilities with natural dialogue."
};

export const TIER_FEATURES = {
  starter: [
    "Web Chat on your website",
    "Facebook Messenger",
    "WhatsApp",
    "Telegram",
    "Instagram",
    "Email"
  ],
  growth: [
    "Everything in the Starter Plan",
    "Basic Voice Integration",
    "Scripted Voice Responses",
    "Simple Call Routing"
  ],
  premium: [
    "Everything in the Growth Plan",
    "Advanced Conversational Voice",
    "Dynamic Dialogue",
    "Complex Problem Solving",
    "SMS Messaging",
    "Multi-turn Conversations"
  ]
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
        starter: 0,
        growth: 0.12,
        premium: 0.12,
      },
      chatbot: {
        starter: { base: 99, perMessage: 0, setupFee: 249, annualPrice: 990, includedVoiceMinutes: 0 },
        growth: { base: 229, perMessage: 0.005, setupFee: 749, annualPrice: 2290, includedVoiceMinutes: 600 },
        premium: { base: 429, perMessage: 0.008, setupFee: 1149, annualPrice: 4290, includedVoiceMinutes: 600 }
      }
    };

    // Update the values from the database
    data.forEach((dbConfig: any) => {
      const config = dbConfig as PricingConfiguration;
      const tier = config.tier as PackageTier;
      
      if (result.voice[tier] !== undefined) {
        result.voice[tier] = config.voice_per_minute;
      }
      
      if (result.chatbot[tier] !== undefined) {
        result.chatbot[tier] = {
          base: config.chatbot_base_price,
          perMessage: tier === 'starter' ? 0 : config.chatbot_per_message, // Ensure starter plan has 0 per-message cost
          setupFee: config.setup_fee || DEFAULT_AI_RATES.chatbot[tier].setupFee,
          annualPrice: config.annual_price || DEFAULT_AI_RATES.chatbot[tier].annualPrice,
          includedVoiceMinutes: config.included_voice_minutes || DEFAULT_AI_RATES.chatbot[tier].includedVoiceMinutes
        };
      }
    });

    return result;
  } catch (error) {
    console.error('Error fetching pricing configurations:', error);
    return DEFAULT_AI_RATES;
  }
};

export const AI_RATES = DEFAULT_AI_RATES;
