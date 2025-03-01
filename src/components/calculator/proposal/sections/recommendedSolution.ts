
import { JsPDFWithAutoTable } from '../types';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: any): number => {
  // Add header with some spacing
  yPosition += 10;
  doc.setFontSize(14);
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${params.tierName || ''} (${params.aiType || ''}) solution. This tailored package provides optimal functionality while maximizing your return on investment.`;
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  // Add pricing table for the detailed plan breakdown
  const setupFee = params.results.aiCostMonthly?.setupFee || 0;
  const annualPlanCost = params.results.annualPlan || (params.results.aiCostMonthly?.total * 10 || 0);
  
  autoTable(doc, {
    startY: yPosition + splitPlanText.length * 7 + 5,
    head: [["Pricing Component", "Details", "Cost"]],
    body: [
      ["Monthly Base Fee", params.tierName || "Custom Plan", formatCurrency(params.results.aiCostMonthly?.total || 0)],
      ["One-time Setup Fee", "Non-refundable", formatCurrency(setupFee)],
      ["Annual Plan Option", "Includes 2 months FREE!", formatCurrency(annualPlanCost)],
      ["Estimated Monthly Savings", "vs. current operations", formatCurrency(params.results.monthlySavings || 0)],
      ["Projected Annual Savings", "First year", formatCurrency(params.results.yearlySavings || 0)]
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'right' }
    },
  });
  
  // Get the last Y position after the table
  const newYPosition = (doc.lastAutoTable?.finalY || yPosition + 40) + 10;
  
  // Add detailed usage information if we have pricing details
  if (params.pricingDetails && params.pricingDetails.length > 0) {
    doc.setFontSize(14);
    doc.text("Detailed Usage Analysis", 20, newYPosition);
    
    let detailYPosition = newYPosition + 8;
    
    // Create an array to store the pricing breakdown data for the table
    const pricingBreakdownData = [];
    
    // Process each pricing detail to add to the table
    params.pricingDetails.forEach(detail => {
      if (detail.title === 'Text AI') {
        pricingBreakdownData.push(
          ["Text AI Base Fee", "", formatCurrency(detail.base || 0)],
          ["Message Volume", `${formatCurrency(detail.totalMessages || 0)} messages/month`, ""],
          ["Message Rate", detail.rate, ""],
          ["Message Usage Cost", "", formatCurrency(detail.usageCost || 0)]
        );
        
        if (detail.volumeDiscount && detail.volumeDiscount > 0) {
          pricingBreakdownData.push(
            ["Volume Discount", "Based on message volume", `-${formatCurrency(detail.volumeDiscount)}`]
          );
        }
        
        pricingBreakdownData.push(
          ["Total Text AI Cost", "", formatCurrency(detail.monthlyCost)]
        );
      } else if (detail.title === 'Voice AI' || detail.title.includes("Voice AI")) {
        pricingBreakdownData.push(
          ["Included Voice Minutes", detail.rate.includes("included") ? detail.rate.split("after ")[1].split(" included")[0] : "0", "Included"],
          ["Monthly Voice Minutes", `${formatCurrency(detail.totalMinutes || 0)} minutes/month`, ""],
          ["Voice Rate", detail.rate, ""],
          ["Voice Usage Cost", "", formatCurrency(detail.usageCost || 0)],
          ["Total Voice AI Cost", "", formatCurrency(detail.monthlyCost)]
        );
      }
    });
    
    // Add detailed pricing breakdown table
    autoTable(doc, {
      startY: detailYPosition,
      body: pricingBreakdownData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      },
    });
    
    // Get the last Y position after the table
    return (doc.lastAutoTable?.finalY || detailYPosition + 60) + 10;
  }
  
  return newYPosition;
};
