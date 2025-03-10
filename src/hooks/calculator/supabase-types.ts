
import type { Json } from '@/integrations/supabase/types';
import type { CalculatorInputs, CalculationResults } from './types';

// Helper function to safely cast our calculator types to Json for Supabase
export const toJson = <T>(data: T): Json => {
  return data as unknown as Json;
};

// Helper function to cast Json back to our calculator types
export const fromJson = <T>(json: Json): T => {
  return json as unknown as T;
};
