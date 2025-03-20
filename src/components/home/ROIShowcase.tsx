
import React from 'react';

const ROIShowcase: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-100 shadow-md p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-brand-500">65%</div>
            <p className="text-sm text-gray-600">Cost Reduction</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-500">24/7</div>
            <p className="text-sm text-gray-600">Operation</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-500">3.5x</div>
            <p className="text-sm text-gray-600">Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIShowcase;
