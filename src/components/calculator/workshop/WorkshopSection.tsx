
import React from 'react';
import { WorkshopContent } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WorkshopSectionProps {
  section: WorkshopContent;
  isActive: boolean;
  onClick: () => void;
}

export const WorkshopSection: React.FC<WorkshopSectionProps> = ({
  section,
  isActive,
  onClick
}) => {
  return (
    <div className={`rounded-lg overflow-hidden transition-all duration-300 border ${isActive ? 'border-brand-500 shadow-md' : 'border-gray-200'}`}>
      <div 
        className={`flex justify-between items-center p-4 cursor-pointer ${isActive ? 'bg-brand-50' : 'bg-gray-50'}`}
        onClick={onClick}
      >
        <h3 className={`font-semibold text-lg ${isActive ? 'text-brand-700' : 'text-gray-700'}`}>
          {section.title}
        </h3>
        <div className="flex items-center">
          {isActive ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>
      
      {isActive && (
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="prose prose-sm max-w-none">
            {section.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-3">{paragraph}</p>
            ))}
          </div>
          {section.bullets && section.bullets.length > 0 && (
            <ul className="list-disc pl-5 mt-3 space-y-1">
              {section.bullets.map((bullet, idx) => (
                <li key={idx} className="text-gray-700">{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
