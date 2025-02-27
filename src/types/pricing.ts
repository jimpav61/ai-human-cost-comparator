
export type PackageTier = 'starter' | 'growth' | 'premium';

export interface PricingConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  tier: PackageTier;
  voice_per_minute: number;
  chatbot_base_price: number;
  chatbot_per_message: number;
  setup_fee: number;
  annual_price: number;
  included_voice_minutes: number;
}
