
import { JsPDFWithAutoTable } from '../types';
import { formatCurrency } from '@/utils/formatters';
import autoTable from 'jspdf-autotable';
import { CalculationResults } from '@/hooks/calculator/types';

export const addCostBreakdownSection = (
  doc: JsPDFWithAutoTable, 
  yPosition: number,
  results: CalculationResults
): number => {
  console.log("Cost Breakdown values for PDF:", {
    basePriceMonthly: results.basePriceMonthly,
    voiceCost: results.aiCostMonthly.voice,
    totalMonthlyCost: results.aiCostMonthly.total,
    additionalVoiceMinutes: results.additionalVoiceMinutes,
    tierKey: results.tierKey,
    aiType: results.aiType
  });
  
  // Ensure we have valid base price based on tier if basePriceMonthly is zero
  let basePrice = results.basePriceMonthly;
  if (basePrice === 0) {
    if (results.tierKey === 'starter') {
      basePrice = 149;
    } else if (results.tierKey === 'growth') {
      basePrice = 229;
    } else if (results.tierKey === 'premium') {
      basePrice = 399;
    } else {
      basePrice = 229; // Default to growth price
    }
  }
  
  // Cost Breakdown Section
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header
  doc.text("Cost Breakdown", 20, yPosition);
  
  yPosition += 8;
  
  // Cost breakdown table
  const tableRows = [];
  
  // CRITICAL FIX: Always use the tierKey from results directly
  // instead of trying to infer it which was causing the issue
  const baseLabel = results.tierKey === 'premium' ? 'Premium AI Service Base' : 
                  results.tierKey === 'growth' ? 'Growth AI Service Base' : 
                  'Starter AI Service Base';
  tableRows.push([baseLabel, formatCurrency(basePrice)]);
  
  // Add voice cost if applicable - only show when there's an actual voice cost
  if (results.aiCostMonthly.voice > 0 || (results.additionalVoiceMinutes && results.additionalVoiceMinutes > 0)) {
    // Show detailed breakdown if we have additional minutes
    if (results.additionalVoiceMinutes && results.additionalVoiceMinutes > 0) {
      const minuteRate = 0.12; // $0.12 per minute
      const additionalCost = results.additionalVoiceMinutes * minuteRate;
      tableRows.push([
        `Voice AI (${results.additionalVoiceMinutes} additional minutes)`,
        formatCurrency(additionalCost)
      ]);
    } else {
      tableRows.push(['Voice AI Service', formatCurrency(results.aiCostMonthly.voice)]);
    }
  }
  
  // Calculate total
  const totalCost = basePrice + (results.aiCostMonthly.voice || 0);
  
  // Add total - use the pre-calculated total or the sum of components
  tableRows.push(['Monthly Total', formatCurrency(results.aiCostMonthly.total > 0 ? results.aiCostMonthly.total : totalCost)]);
  
  // Create the breakdown table with same styling as frontend
  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Monthly Cost']],
    body: tableRows,
    headStyles: {
      fillColor: [246, 82, 40] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as 'bold'
    },
    bodyStyles: {
      textColor: [0, 0, 0] as [number, number, number]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245] as [number, number, number]
    },
    styles: {
      fontSize: 11
    },
    columnStyles: {
      0: { fontStyle: 'normal' as 'normal' },
      1: { halign: 'right' as 'right' }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Return the new y position
  return (doc as any).lastAutoTable.finalY + 15;
};
