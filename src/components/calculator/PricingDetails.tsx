
import React from 'react';
import { DollarSign, Clock, CreditCard } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { PricingDetail } from './types';

interface PricingDetailsProps {
  details: PricingDetail[];
  setupFee: number;
  annualPlan: number;
  includedVoiceMinutes?: number;
  extraVoiceMinutes?: number;
  additionalVoiceCost?: number;
}

export const PricingDetails: React.FC<PricingDetailsProps> = ({ 
  details, 
  setupFee, 
  annualPlan,
  includedVoiceMinutes,
  extraVoiceMinutes = 0,
  additionalVoiceCost = 0
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-900">One-time Setup/Onboarding Fee</span>
          <span className="text-brand-600 font-semibold">{formatCurrency(setupFee)}</span>
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 mr-1" />
            Required non-refundable one-time fee
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-900">Annual Plan Option</span>
          <span className="text-brand-600 font-semibold">{formatCurrency(annualPlan)}/year</span>
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Includes 2 Months FREE!
          </div>
        </div>
      </div>

      {includedVoiceMinutes && includedVoiceMinutes > 0 && (
        <div className="border-b border-gray-200 pb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">Included Voice Minutes</span>
            <span className="text-brand-600 font-semibold">{formatNumber(includedVoiceMinutes)} minutes</span>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              12¢ per minute after {formatNumber(includedVoiceMinutes)} minutes
            </div>
          </div>
        </div>
      )}
      
      {extraVoiceMinutes > 0 && (
        <div className="border-b border-gray-200 pb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">Additional Voice Minutes</span>
            <span className="text-brand-600 font-semibold">{formatNumber(extraVoiceMinutes)} minutes</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              At 12¢ per minute
            </div>
            <span className="text-brand-600 font-medium">{formatCurrency(additionalVoiceCost)}</span>
          </div>
        </div>
      )}

      {details.map((detail, index) => (
        <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">{detail.title}</span>
            <span className="text-brand-600 font-semibold">{formatCurrency(detail.monthlyCost)}/month</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {detail.base !== null && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Flat monthly subscription: {formatCurrency(detail.base)}
              </div>
            )}
            {detail.totalMessages && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Monthly message capacity: {formatNumber(detail.totalMessages)} messages
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
