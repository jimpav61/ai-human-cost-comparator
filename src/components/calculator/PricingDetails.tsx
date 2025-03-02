
import React from 'react';
import { DollarSign, Clock, CreditCard } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { PricingDetail } from './types';

interface PricingDetailsProps {
  details: PricingDetail[];
  setupFee: number;
  annualPlan: number;
  includedVoiceMinutes?: number;
}

export const PricingDetails: React.FC<PricingDetailsProps> = ({ 
  details, 
  setupFee, 
  annualPlan,
  includedVoiceMinutes
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
                Base fee: {formatCurrency(detail.base)}/month
              </div>
            )}
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Usage rate: {detail.rate}
            </div>
            <div className="flex items-center">
              <span className="font-medium">Monthly volume:</span>
              <span className="ml-2">
                {detail.totalMessages 
                  ? `${formatNumber(detail.totalMessages)} messages`
                  : `${formatNumber(detail.totalMinutes!)} minutes`}
              </span>
            </div>
            {detail.usageCost !== undefined && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Usage cost: {formatCurrency(detail.usageCost)}/month
              </div>
            )}
            {detail.volumeDiscount !== undefined && detail.volumeDiscount > 0 && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Volume discount: {formatCurrency(-detail.volumeDiscount)}/month
              </div>
            )}
            {detail.complexityFactor !== undefined && detail.complexityFactor !== 1 && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Complexity factor: {detail.complexityFactor.toFixed(2)}x
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
