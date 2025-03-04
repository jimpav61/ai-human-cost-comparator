
import React from 'react';

interface AITypeSectionProps {
  aiType: string;
  aiTier: string;
  handleAITypeChange: (value: string) => void;
}

export const AITypeSection: React.FC<AITypeSectionProps> = ({
  aiType,
  aiTier,
  handleAITypeChange
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">AI Type</label>
      <select 
        value={aiType}
        onChange={(e) => handleAITypeChange(e.target.value)}
        className="calculator-input"
      >
        <option value="chatbot">Text Only</option>
        <option value="voice" disabled={aiTier === 'starter'}>Basic Voice Only</option>
        <option value="conversationalVoice" disabled={aiTier !== 'premium'}>Conversational Voice Only</option>
        <option value="both" disabled={aiTier === 'starter'}>Text & Basic Voice</option>
        <option value="both-premium" disabled={aiTier !== 'premium'}>Text & Conversational Voice</option>
      </select>
      {aiTier === 'starter' && (
        <p className="text-sm text-amber-600 mt-1">
          Note: Starter Plan only supports text capabilities. Select Growth or Premium Plan for voice.
        </p>
      )}
      {(aiType === 'conversationalVoice' || aiType === 'both-premium') && aiTier !== 'premium' && (
        <p className="text-sm text-amber-600 mt-1">
          Conversational Voice AI requires the Premium Plan.
        </p>
      )}
      {(aiType === 'conversationalVoice' || aiType === 'both-premium') && aiTier === 'premium' && (
        <p className="text-sm text-green-600 mt-1">
          Conversational Voice AI requires the Premium Plan.
        </p>
      )}
    </div>
  );
};
