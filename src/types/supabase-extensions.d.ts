
import type { Json } from '@/integrations/supabase/types';
import type { CalculatorInputs, CalculationResults } from '@/hooks/useCalculator';

// Extending TypeScript's type system to understand our calculator types can be assigned to Json
declare global {
  interface JsonCompatible {
    calculatorInputs: CalculatorInputs;
    calculationResults: CalculationResults;
  }
}

// This declaration merges with the existing Json type from Supabase
declare module '@/integrations/supabase/types' {
  // This tells TypeScript that our calculator types are compatible with the Json type
  export interface Json {
    calculatorInputs?: CalculatorInputs;
    calculationResults?: CalculationResults;
  }
}

// This is just to make the file a proper module
export {};
