
import { CalculatorInputs } from "@/hooks/calculator/types";
import { CalculationResults } from "@/hooks/calculator/types";

export interface Lead {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone_number: string;
  website: string;
  industry: string;
  employee_count: number;
  calculator_inputs: CalculatorInputs;
  calculator_results: CalculationResults;
  proposal_sent: boolean;
  created_at: string;
  updated_at: string; // Added this property
  form_completed?: boolean;
}
