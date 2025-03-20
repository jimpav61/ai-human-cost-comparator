
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PricingDetail, LeadData } from './types';
import { CalculationResults } from '@/hooks/calculator/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { calculatePricingDetails } from './pricingDetailsCalculator';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { getPlanName } from '@/utils/planNameFormatter';
import { FileText, ArrowRight, BookOpen } from 'lucide-react';
import { generateAndDownloadReport } from '@/utils/report/generateReport';
import { AIWorkshop } from './workshop/AIWorkshop';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/leads';

interface ResultsDisplayProps {
  results: CalculationResults;
  reportGenerated: boolean;
  onGenerateReport: () => void;
  inputs: CalculatorInputs;
  leadData: LeadData;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  reportGenerated,
  onGenerateReport,
  inputs,
  leadData
}) => {
  const [showWorkshop, setShowWorkshop] = useState(false);
  const [downloadedReport, setDownloadedReport] = useState(false);
  
  console.log("ResultsDisplay - Lead ID:", leadData.id);
  console.log("ResultsDisplay - Inputs:", inputs);
  console.log("ResultsDisplay - Results:", results);
  
  const pricingDetails = calculatePricingDetails(inputs);
  console.log("ResultsDisplay - PricingDetails:", pricingDetails);
  
  const aiTypeDisplay = inputs.aiType === 'chatbot' ? 'Text Only' : 
                      inputs.aiType === 'voice' ? 'Basic Voice' : 
                      inputs.aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                      inputs.aiType === 'both' ? 'Text & Basic Voice' : 
                      inputs.aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Custom';
  
  const planName = getPlanName(inputs.aiTier);
  
  const handleDownloadReport = async () => {
    try {
      // First create/update lead in Supabase
      const leadId = leadData.id;
      
      // Add current timestamp to lead data
      const currentTime = new Date().toISOString();
      
      // Format the lead data to match the Lead type
      const completeLeadData: Lead = {
        id: leadData.id || '',
        name: leadData.name,
        company_name: leadData.companyName,
        email: leadData.email,
        phone_number: leadData.phoneNumber || '',
        website: leadData.website || '',
        industry: leadData.industry || '',
        employee_count: leadData.employeeCount || 0,
        calculator_inputs: inputs,
        calculator_results: results,
        proposal_sent: false,
        created_at: currentTime,
        updated_at: currentTime,
        form_completed: true
      };
      
      // Generate and download the PDF
      await generateAndDownloadReport(completeLeadData);
      setDownloadedReport(true);
      
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };
  
  return (
    <div>
      <Card className="shadow-lg border-gray-200">
        <CardContent className="p-5">
          <div className="mb-4">
            <Badge variant="outline" className="bg-red-50 text-red-600 hover:bg-red-50 border-red-200 mb-2">
              Selected Plan: {planName} ({aiTypeDisplay})
            </Badge>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm text-gray-500 mb-1">Current Staff Cost</h3>
                <p className="text-3xl font-semibold text-gray-900">{formatCurrency(results.humanCostMonthly)}</p>
                <p className="text-xs text-gray-500">
                  {results.humanHours.monthlyTotal.toFixed(3)} labor hours/month
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="text-sm text-gray-500 mb-1">Your ChatSites.ai Cost</h3>
                <p className="text-3xl font-semibold text-red-600">{formatCurrency(results.aiCostMonthly.total)}</p>
                <p className="text-xs text-gray-500">
                  One-time setup: {formatCurrency(results.aiCostMonthly.setupFee)}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm text-gray-500 mb-1">Monthly Savings</h3>
                <p className="text-3xl font-semibold text-green-600">{formatCurrency(results.monthlySavings)}</p>
                <p className="text-xs text-gray-500">
                  {formatPercent(results.savingsPercentage)} vs. human labor
                </p>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="text-lg font-semibold mb-3">Human Resource Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium mb-2">Labor Hours</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Daily per employee:</td>
                    <td className="py-2 text-right">{results.humanHours.dailyPerEmployee} hours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Weekly total:</td>
                    <td className="py-2 text-right">{results.humanHours.weeklyTotal} hours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Monthly total:</td>
                    <td className="py-2 text-right">{results.humanHours.monthlyTotal.toFixed(3)} hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h4 className="text-md font-medium mb-2">Labor Costs</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Current human staff cost:</td>
                    <td className="py-2 text-right">{formatCurrency(results.humanCostMonthly)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Your ChatSites.ai cost:</td>
                    <td className="py-2 text-right text-red-600">{formatCurrency(results.aiCostMonthly.total)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Monthly savings:</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(results.monthlySavings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            {reportGenerated ? (
              <div className="space-y-4">
                <p className="text-gray-700 mb-4">Your Report is Ready</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleDownloadReport}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Detailed Report
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowWorkshop(true)}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Implementation Workshop
                  </Button>
                </div>
                
                {downloadedReport && !showWorkshop && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h3 className="font-medium text-amber-800">Next Step: View Your Implementation Workshop</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      See how ChatSites.ai can be implemented in your business in 1-7 days
                    </p>
                    <Button 
                      variant="outline"
                      className="mt-2 border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800"
                      onClick={() => setShowWorkshop(true)}>
                      Open Workshop <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                onClick={onGenerateReport}
                className="bg-red-600 hover:bg-red-700 text-white">
                Generate ROI Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {showWorkshop && (
        <div className="mt-8 animate-fadeIn">
          <AIWorkshop
            leadData={leadData}
            aiType={inputs.aiType}
            tierName={planName}
          />
        </div>
      )}
    </div>
  );
};
