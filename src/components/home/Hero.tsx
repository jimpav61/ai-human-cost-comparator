
import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="text-left animate-fadeIn">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">AiGent Compass</h1>
        <p className="text-xl text-gray-600">
          Strategic AI Integration Calculator for Modern Business Operations
        </p>
      </div>
      <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-100 shadow-md p-5">
        <ul className="space-y-2">
          {['Reduce operational costs by up to 65%', 'Operate 24/7 with AI assistance', 'Increase efficiency by 3.5x', 'Get personalized AI recommendations'].map((benefit, i) => (
            <li key={i} className="flex items-center text-gray-700">
              <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Hero;
