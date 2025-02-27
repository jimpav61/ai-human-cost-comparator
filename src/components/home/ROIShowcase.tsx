
import React from 'react';

const ROIShowcase: React.FC = () => {
  return (
    <div className="mb-16 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Real Business Impact
      </h2>
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-100 shadow-lg p-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-500 mb-2">65%</div>
            <p className="text-gray-600">Average Cost Reduction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-500 mb-2">24/7</div>
            <p className="text-gray-600">Continuous Operation</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-500 mb-2">3.5x</div>
            <p className="text-gray-600">Increased Efficiency</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIShowcase;
