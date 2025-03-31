
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const ROIShowcase: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-100 shadow-md p-4 max-w-4xl mx-auto">
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-wrap justify-center gap-8'} text-center`}>
          <div className={isMobile ? 'py-2' : ''}>
            <div className="text-2xl font-bold text-brand-500">65%</div>
            <p className="text-sm text-gray-600">Cost Reduction</p>
          </div>
          <div className={isMobile ? 'py-2' : ''}>
            <div className="text-2xl font-bold text-brand-500">24/7</div>
            <p className="text-sm text-gray-600">Operation</p>
          </div>
          <div className={isMobile ? 'py-2' : ''}>
            <div className="text-2xl font-bold text-brand-500">3.5x</div>
            <p className="text-sm text-gray-600">Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIShowcase;
