
import { JsPDFWithAutoTable } from '../types';
import 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import { getTierDisplayName, getAITypeDisplay } from '@/components/calculator/pricingDetailsCalculator';
import { AI_RATES } from '@/constants/pricing';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: any): number => {
  // Add header with some spacing
  yPosition += 10;
  doc.setFontSize(14);
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  
  // Get tier name and AI type
  const tierName = params.tierName || getTierDisplayName(params.results?.aiTier || 'growth');
  const aiType = params.aiType || getAITypeDisplay(params.results?.aiType || 'both');
  
  // Extract tier key from the name
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                tierName.toLowerCase().includes('growth') ? 'growth' : 
                tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
  
  // Get the correct included minutes based on the tier
  const includedMinutes = AI_RATES.chatbot[tierKey]?.includedVoiceMinutes || 0;
  
  // Plan details - Use tierName exactly as provided from our standard plans
  let planText = `Based on your specific needs, we recommend our ${tierName} solution. This tailored package provides optimal functionality while maximizing your return on investment.`;
  
  // Add voice capabilities information if not starter plan
  if (tierKey !== 'starter' && (aiType.toLowerCase().includes('voice') || aiType.toLowerCase().includes('both'))) {
    planText += ` The plan includes ${includedMinutes} free voice minutes per month.`;
  } else if (tierKey === 'starter') {
    planText += ` Note that the Starter Plan does not include voice capabilities.`;
  }
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  // Add pricing table for the detailed plan breakdown
  // Get the setup fee specifically from AI_RATES instead of from params
  const setupFee = AI_RATES.chatbot[tierKey].setupFee || 0;
  const annualPlanCost = params.results.annualPlan || (params.results.aiCostMonthly?.total * 10 || 0);
  
  // Add a heading for our pricing before the table
  const tableY = yPosition + splitPlanText.length * 7 + 8;
  doc.setFontSize(12);
  doc.text("Your ChatSites.ai Investment", 20, tableY - 5);
  
  // Get the exact monthly fee from the base price in AI_RATES
  const monthlyBaseFee = AI_RATES.chatbot[tierKey]?.base || 0;
  
  doc.autoTable({
    startY: tableY,
    head: [["Pricing Component", "Details", "Cost"]],
    body: [
      ["Monthly Base Fee", tierName, formatCurrency(monthlyBaseFee)],
      ["One-time Setup/Onboarding Fee", "Non-refundable", formatCurrency(setupFee)],
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
    // Use willDrawCell instead of rowStyles for more control over cell styling
    willDrawCell: function(data) {
      // Apply specific styling based on row index
      if (data.section === 'body') {
        if (data.row.index === 0 || data.row.index === 2) {
          // Highlight monthly fee and annual plan with green
          data.cell.styles.fillColor = [226, 240, 217];
          if (data.row.index === 0) {
            data.cell.styles.fontStyle = 'bold';
          }
        } else if (data.row.index === 1) {
          // Highlight the one-time setup fee with a different color
          data.cell.styles.fillColor = [255, 242, 204];
          data.cell.styles.fontStyle = 'bold';
        } else {
          // Apply light gray background to other rows
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    }
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
          ["Text AI Base Fee", "", formatCurrency(detail.base || 0)]
        );
        
        // For Starter plan, there are no per-message costs
        if (params.tierName && params.tierName.includes('Starter')) {
          pricingBreakdownData.push(
            ["Message Volume", `${formatCurrency(detail.totalMessages || 0)} messages/month`, "Included in base fee"],
            ["Total Text AI Cost", "", formatCurrency(detail.base || 0)]
          );
        } else {
          pricingBreakdownData.push(
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
        }
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
    
    // Add a row for the one-time setup fee - get from AI_RATES
    pricingBreakdownData.push(
      ["One-time Setup/Onboarding Fee", "Required for all plans", formatCurrency(setupFee)]
    );
    
    // Add detailed pricing breakdown table
    doc.autoTable({
      startY: detailYPosition,
      body: pricingBreakdownData,
      theme: 'striped',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' }
      },
      willDrawCell: function(data) {
        // Highlight the setup fee row
        if (data.row.index === pricingBreakdownData.length - 1 && data.section === 'body') {
          data.cell.styles.fillColor = [255, 242, 204];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    
    // Get the last Y position after the table
    return (doc.lastAutoTable?.finalY || detailYPosition + 60) + 10;
  }
  
  return newYPosition;
};
