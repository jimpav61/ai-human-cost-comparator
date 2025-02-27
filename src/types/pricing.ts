
export type PackageTier = 'basic' | 'standard' | 'premium';

export interface PricingConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  tier: PackageTier;
  voice_per_minute: number;
  chatbot_base_price: number;
  chatbot_per_message: number;
}
