
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
    starter: { base: 99, perMessage: 0.003, setupFee: 249, annualPrice: 990, includedVoiceMinutes: 0 },
    growth: { base: 229, perMessage: 0.005, setupFee: 749, annualPrice: 2290, includedVoiceMinutes: 600 },
    premium: { base: 429, perMessage: 0.008, setupFee: 1149, annualPrice: 4290, includedVoiceMinutes: 600 }
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

export const TIER_DESCRIPTIONS = {
  starter: "Perfect for businesses looking for basic text-based customer interaction.",
  growth: "Ideal for businesses that want to add voice capabilities.",
  premium: "For businesses that want the most advanced communication options."
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
    "Voice Integration"
  ],
  premium: [
    "Everything in the Growth Plan",
    "SMS Messaging",
    "Voice Calls"
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
        starter: { base: 99, perMessage: 0.003, setupFee: 249, annualPrice: 990, includedVoiceMinutes: 0 },
        growth: { base: 229, perMessage: 0.005, setupFee: 749, annualPrice: 2290, includedVoiceMinutes: 600 },
        premium: { base: 429, perMessage: 0.008, setupFee: 1149, annualPrice: 4290, includedVoiceMinutes: 600 }
      }
    };

    // Update the values from the database
    data.forEach((config: PricingConfiguration) => {
      result.voice[config.tier] = config.voice_per_minute;
      result.chatbot[config.tier] = {
        base: config.chatbot_base_price,
        perMessage: config.chatbot_per_message,
        setupFee: config.setup_fee || DEFAULT_AI_RATES.chatbot[config.tier as PackageTier].setupFee,
        annualPrice: config.annual_price || DEFAULT_AI_RATES.chatbot[config.tier as PackageTier].annualPrice,
        includedVoiceMinutes: config.included_voice_minutes || DEFAULT_AI_RATES.chatbot[config.tier as PackageTier].includedVoiceMinutes
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching pricing configurations:', error);
    return DEFAULT_AI_RATES;
  }
};

export const AI_RATES = DEFAULT_AI_RATES;
