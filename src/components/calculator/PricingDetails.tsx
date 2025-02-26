
import React from 'react';
import { DollarSign, Clock } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { PricingDetail } from './types';

interface PricingDetailsProps {
  details: PricingDetail[];
}

export const PricingDetails: React.FC<PricingDetailsProps> = ({ details }) => {
  return (
    <div className="space-y-4">
      {details.map((detail, index) => (
        <div key={index} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-900">{detail.title}</span>
            <span className="text-brand-600 font-semibold">{formatCurrency(detail.monthlyCost)}/month</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {detail.base && (
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
          </div>
        </div>
      ))}
    </div>
  );
};
