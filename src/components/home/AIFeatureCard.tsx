
import React from 'react';

interface AIFeatureCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const AIFeatureCard: React.FC<AIFeatureCardProps> = ({ title, icon, description, features }) => {
  return (
    <div className="calculator-card h-full p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-brand-500">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <ul className="text-sm text-gray-600 space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-4 w-4 mr-1 text-brand-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIFeatureCard;
