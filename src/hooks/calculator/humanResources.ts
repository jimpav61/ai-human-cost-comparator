
import { HUMAN_HOURLY_RATES } from '@/constants/pricing';
import { CalculatorInputs } from './types';
import { HOURS_PER_SHIFT, DAYS_PER_WEEK, WEEKS_PER_YEAR, MONTHS_PER_YEAR } from './constants';

/**
 * Calculate human resource metrics based on total employees minus one (replaced by AI)
 */
export function calculateHumanResources(inputs: CalculatorInputs) {
  // Calculate metrics for employees minus one (the one replaced by AI)
  const employeesAfterAI = Math.max(inputs.numEmployees - 1, 0);
  const dailyHoursPerEmployee = HOURS_PER_SHIFT;
  const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
  const weeklyTotalHours = weeklyHoursPerEmployee * employeesAfterAI;
  const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;
  
  console.log("🧪 HUMAN RESOURCES TEST:", {
    scenario: `${inputs.numEmployees} ${inputs.role} employees, 1 replaced by AI`,
    totalEmployees: inputs.numEmployees,
    employeesAfterAI,
    dailyHoursPerEmployee,
    weeklyHoursPerEmployee,
    weeklyTotalHours,
    monthlyTotalHours,
    yearlyTotalHours
  });
  
  return {
    dailyPerEmployee: dailyHoursPerEmployee,
    weeklyTotal: weeklyTotalHours,
    monthlyTotal: monthlyTotalHours,
    yearlyTotal: yearlyTotalHours
  };
}

/**
 * Calculate human resource costs based on remaining employees after AI replacement
 */
export function calculateHumanCosts(inputs: CalculatorInputs, monthlyHours: number) {
  const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
  const hourlyRateWithBenefits = baseHourlyRate * 1.3; // Add 30% for benefits
  const monthlyHumanCost = hourlyRateWithBenefits * monthlyHours;
  
  console.log("🧪 HUMAN COSTS TEST:", {
    role: inputs.role,
    baseHourlyRate,
    hourlyRateWithBenefits,
    monthlyHours,
    monthlyHumanCost,
    yearlyHumanCost: monthlyHumanCost * 12
  });
  
  return {
    hourlyRate: baseHourlyRate,
    hourlyRateWithBenefits,
    monthlyHumanCost
  };
}
