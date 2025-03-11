
import { HUMAN_HOURLY_RATES } from '@/constants/pricing';
import { CalculatorInputs } from './types';
import { HOURS_PER_SHIFT, DAYS_PER_WEEK, WEEKS_PER_YEAR, MONTHS_PER_YEAR } from './constants';

/**
 * Calculate human resource metrics for one employee (the one to be replaced by AI)
 */
export function calculateHumanResources(inputs: CalculatorInputs) {
  // Calculate metrics for just ONE employee (the one to be replaced by AI)
  const dailyHoursPerEmployee = HOURS_PER_SHIFT;
  const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
  const monthlyTotalHours = (weeklyHoursPerEmployee * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  const yearlyTotalHours = weeklyHoursPerEmployee * WEEKS_PER_YEAR;
  
  console.log("🧪 HUMAN RESOURCES TEST:", {
    scenario: `Calculating hours for 1 ${inputs.role} employee to be replaced by AI`,
    dailyHoursPerEmployee,
    weeklyHoursPerEmployee,
    monthlyTotalHours,
    yearlyTotalHours
  });
  
  return {
    dailyPerEmployee: dailyHoursPerEmployee,
    weeklyTotal: weeklyHoursPerEmployee,
    monthlyTotal: monthlyTotalHours,
    yearlyTotal: yearlyTotalHours
  };
}

/**
 * Calculate human resource costs for one employee
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
