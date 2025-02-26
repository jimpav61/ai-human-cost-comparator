import React from 'react';
import { Button } from "@/components/ui/button";
import type { CalculationResults } from '@/hooks/useCalculator';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onGenerateReport,
  reportGenerated
}) => {
  const aiPlacements = [
    {
      role: "Customer Service",
      capabilities: [
        "24/7 basic customer support",
        "FAQs and troubleshooting",
        "Order status tracking",
        "Return requests"
      ]
    },
    {
      role: "Sales Support",
      capabilities: [
        "Product recommendations",
        "Price quotes",
        "Appointment scheduling",
        "Lead qualification"
      ]
    },
    {
      role: "IT Help Desk",
      capabilities: [
        "Password resets",
        "Basic technical support",
        "Software installation guidance",
        "System status updates"
      ]
    }
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    const company = "Your Business"; // This could be passed as a prop

    // Title
    doc.setFontSize(20);
    doc.text("AI Integration Cost Analysis Report", 20, 20);
    
    // Cost Summary
    doc.setFontSize(14);
    doc.text("Cost Summary", 20, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Category", "Monthly Cost", "Annual Cost"]],
      body: [
        ["Human Resources", formatCurrency(results.humanCostMonthly), formatCurrency(results.humanCostMonthly * 12)],
        ["AI Solution", formatCurrency(results.aiCostMonthly.total), formatCurrency(results.aiCostMonthly.total * 12)],
        ["Potential Savings", formatCurrency(results.monthlySavings), formatCurrency(results.yearlySavings)]
      ],
    });

    // Resource Utilization
    doc.setFontSize(14);
    doc.text("Resource Utilization", 20, doc.lastAutoTable.finalY + 20);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Metric", "Value"]],
      body: [
        ["Daily Hours per Employee", `${results.humanHours.dailyPerEmployee} hours`],
        ["Weekly Total Hours", `${formatNumber(results.humanHours.weeklyTotal)} hours`],
        ["Monthly Total Hours", `${formatNumber(results.humanHours.monthlyTotal)} hours`]
      ],
    });

    // AI Placement Opportunities
    doc.addPage();
    doc.setFontSize(14);
    doc.text("AI Integration Opportunities", 20, 20);
    
    let yPos = 30;
    aiPlacements.forEach(placement => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text(`${placement.role}:`, 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      placement.capabilities.forEach(capability => {
        doc.text(`• ${capability}`, 30, yPos);
        yPos += 7;
      });
      yPos += 10;
    });

    // ROI Summary
    doc.setFontSize(14);
    doc.text("Return on Investment", 20, yPos + 10);
    doc.setFontSize(10);
    doc.text(`• Projected Annual Savings: ${formatCurrency(results.yearlySavings)}`, 30, yPos + 20);
    doc.text(`• Cost Reduction: ${formatPercent(results.savingsPercentage)}`, 30, yPos + 30);
    doc.text(`• 24/7 Operation Capability`, 30, yPos + 40);

    // Add compelling call to action
    doc.setFontSize(12);
    doc.setTextColor(246, 82, 40); // Brand color
    doc.text("Ready to transform your business operations?", 20, yPos + 60);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("Contact us today to start your AI integration journey.", 20, yPos + 70);

    // Save the PDF
    doc.save(`${company}-AI-Integration-Analysis.pdf`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Results</h3>

        {/* Human Resource Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Human Resource Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Daily Hours per Employee:</p>
              <p className="font-medium">{results.humanHours.dailyPerEmployee} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Weekly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.weeklyTotal)} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Monthly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.monthlyTotal)} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Total Yearly Hours:</p>
              <p className="font-medium">{formatNumber(results.humanHours.yearlyTotal)} hours</p>
            </div>
          </div>
        </div>

        {/* AI Placement Opportunities */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Integration Opportunities</h4>
          <div className="space-y-3">
            {aiPlacements.map((placement, index) => (
              <div key={index} className="text-sm">
                <p className="font-medium text-gray-700">{placement.role}</p>
                <ul className="list-disc list-inside text-gray-600 pl-4 space-y-1">
                  {placement.capabilities.slice(0, 2).map((capability, idx) => (
                    <li key={idx}>{capability}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Costs and Savings */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly Human Cost:</span>
            <span className="font-semibold">{formatCurrency(results.humanCostMonthly)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Monthly AI Cost:</span>
            <span className="font-semibold">{formatCurrency(results.aiCostMonthly.total)}</span>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700 font-medium">Monthly Savings:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(results.monthlySavings)}
              </span>
            </div>
          </div>
        </div>

        {/* Annual Savings */}
        <div className="bg-brand-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Annual Savings:</span>
            <span className="font-bold text-brand-600 text-lg">
              {formatCurrency(results.yearlySavings)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">Savings Percentage:</span>
            <span className="font-semibold text-brand-600">
              {formatPercent(results.savingsPercentage)}
            </span>
          </div>
        </div>

        {/* Break-even Points */}
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium text-gray-700">Break-even Points</h4>
          {results.breakEvenPoint.voice > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Voice Calls:</span>
              <span>{formatNumber(results.breakEvenPoint.voice)} minutes</span>
            </div>
          )}
          {results.breakEvenPoint.chatbot > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Chat Messages:</span>
              <span>{formatNumber(results.breakEvenPoint.chatbot)} messages</span>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button
            onClick={generatePDF}
            className="w-full bg-brand-primary hover:bg-brand-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Detailed Report
          </Button>
        </div>
      </div>
    </div>
  );
};
