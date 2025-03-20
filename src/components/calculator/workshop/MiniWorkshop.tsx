
import React, { useState } from 'react';
import { LeadData } from '../types';
import { generateWorkshopContent } from './generateWorkshopContent';
import { WorkshopSection } from './WorkshopSection';

interface MiniWorkshopProps {
  leadData: LeadData;
  aiType: string;
  tierName: string;
}

export const MiniWorkshop: React.FC<MiniWorkshopProps> = ({ 
  leadData, 
  aiType, 
  tierName 
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const workshopContent = generateWorkshopContent(leadData, aiType, tierName);
  
  // Extract first name for personalized greeting
  const firstName = leadData.name?.split(' ')[0] || '';
  const companyName = leadData.companyName || 'your business';
  
  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {firstName ? `${firstName}'s` : 'Your'} Personalized AI Implementation Workshop
        </h2>
      </div>
      
      <p className="text-gray-600 mb-8">
        This customized workshop will guide {companyName} through implementing AI based on your specific needs and industry requirements.
      </p>
      
      <div className="space-y-4">
        {workshopContent.map((section, index) => (
          <WorkshopSection
            key={index}
            section={section}
            isActive={currentSection === index}
            onClick={() => setCurrentSection(index)}
          />
        ))}
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This content is personalized based on your calculator inputs and {leadData.industry || 'industry'} data.</p>
      </div>
    </div>
  );
};
