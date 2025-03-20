
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
  
  return (
    <div className="mt-12 bg-white rounded-xl shadow-md p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Personalized AI Implementation Mini-Workshop
        </h2>
      </div>
      
      <p className="text-gray-600 mb-8">
        This personalized workshop will guide you through implementing AI in your business based on your specific needs.
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
        <p>This content is generated based on your calculator inputs and industry data.</p>
      </div>
    </div>
  );
};
