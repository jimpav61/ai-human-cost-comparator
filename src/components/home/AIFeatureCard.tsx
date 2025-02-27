
import React from 'react';

interface AIFeatureCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const AIFeatureCard: React.FC<AIFeatureCardProps> = ({ title, icon, description, features }) => {
  return (
    <div className="calculator-card p-6 h-full">
      <div className="text-brand-500 mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-4 text-center text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-6 text-center">
        {description}
      </p>
      <ul className="text-gray-600 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIFeatureCard;
