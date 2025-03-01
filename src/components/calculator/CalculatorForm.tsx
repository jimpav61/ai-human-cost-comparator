
import React, { useEffect } from 'react';
import { ROLE_LABELS } from '@/constants/pricing';
import { TierComparison } from './TierComparison';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import { toast } from "@/components/ui/use-toast";

interface CalculatorFormProps {
  inputs: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ inputs, onInputChange }) => {
  // Select appropriate tier when AI type changes
  useEffect(() => {
    if (inputs.aiType === 'chatbot' && inputs.aiTier !== 'starter') {
      // If only text is needed, default to starter plan
      onInputChange('aiTier', 'starter');
      toast({
        title: "Plan Updated",
        description: "Switched to Starter Plan since only text capabilities are needed.",
        variant: "default",
      });
    } else if (inputs.aiType === 'voice' && inputs.aiTier === 'starter') {
      // If basic voice is needed, upgrade to growth plan
      onInputChange('aiTier', 'growth');
      toast({
        title: "Plan Upgraded",
        description: "Voice features require at least the Growth Plan. We've automatically upgraded your selection.",
        variant: "default",
      });
    } else if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
      // If conversational voice is needed, upgrade to premium plan
      onInputChange('aiTier', 'premium');
      toast({
        title: "Premium Plan Selected",
        description: "Conversational Voice AI requires the Premium Plan. We've automatically selected it for you.",
        variant: "default",
      });
    }
  }, [inputs.aiType]);

  const handleTierSelect = (tier: string) => {
    if (tier === 'starter' && (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium')) {
      toast({
        title: "Voice Features Not Available",
        description: "The Starter Plan doesn't support voice features. Please select Growth or Premium Plan for voice capabilities.",
        variant: "destructive",
      });
      return;
    }
    
    // If selecting growth tier but using conversational voice, warn the user
    if (tier === 'growth' && (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium')) {
      toast({
        title: "Conversational Voice Not Available",
        description: "Conversational Voice AI requires the Premium Plan. Switching to basic voice capabilities.",
        variant: "warning",
      });
      onInputChange('aiType', 'voice');
    }
    
    onInputChange('aiTier', tier as any);
  };

  const handleAITypeChange = (value: string) => {
    onInputChange('aiType', value as any);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
        <h3 className="text-xl font-medium text-gray-900 mb-6">Plan Selection</h3>
        
        <div className="mb-6">
          <TierComparison 
            currentTier={inputs.aiTier} 
            onSelectTier={handleTierSelect} 
            currentAIType={inputs.aiType}
          />
        </div>

        <h3 className="text-xl font-medium text-gray-900 mb-6">Configuration</h3>
        
        {/* Job Role Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
          <select 
            value={inputs.role}
            onChange={(e) => onInputChange('role', e.target.value)}
            className="calculator-input"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Number of Employees */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Employees
          </label>
          <input 
            type="number" 
            min="1"
            value={inputs.numEmployees}
            onChange={(e) => onInputChange('numEmployees', parseInt(e.target.value) || 1)}
            className="calculator-input"
          />
          <p className="text-sm text-gray-500 mt-1">
            Based on 8-hour workday, 5 days per week
          </p>
        </div>
        
        {/* AI Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Type</label>
          <select 
            value={inputs.aiType}
            onChange={(e) => handleAITypeChange(e.target.value)}
            className="calculator-input"
          >
            <option value="chatbot">Text Only</option>
            <option value="voice">Basic Voice Only</option>
            <option value="conversationalVoice">Conversational Voice Only</option>
            <option value="both">Text & Basic Voice</option>
            <option value="both-premium">Text & Conversational Voice</option>
          </select>
          {inputs.aiTier === 'starter' && (
            <p className="text-sm text-amber-600 mt-1">
              Note: Starter Plan only supports text capabilities. Select Growth or Premium Plan for voice.
            </p>
          )}
          {inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium' ? (
            <p className="text-sm text-green-600 mt-1">
              Conversational Voice AI requires the Premium Plan.
            </p>
          ) : null}
        </div>
        
        {(inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') && (
          <>
            {/* Voice-specific inputs */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Call Volume
              </label>
              <input 
                type="number" 
                min="1"
                value={inputs.callVolume}
                onChange={(e) => onInputChange('callVolume', parseInt(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Call Duration (minutes)
              </label>
              <input 
                type="number" 
                min="0.5" 
                step="0.5"
                value={inputs.avgCallDuration}
                onChange={(e) => onInputChange('avgCallDuration', parseFloat(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
          </>
        )}
        
        {(inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') && (
          <>
            {/* Chatbot-specific inputs */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Chat Volume
              </label>
              <input 
                type="number" 
                min="1"
                value={inputs.chatVolume}
                onChange={(e) => onInputChange('chatVolume', parseInt(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Chat Length (messages)
              </label>
              <input 
                type="number" 
                min="1"
                value={inputs.avgChatLength}
                onChange={(e) => onInputChange('avgChatLength', parseInt(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Average Chat Resolution Time (minutes)
              </label>
              <input 
                type="number" 
                min="1"
                value={inputs.avgChatResolutionTime}
                onChange={(e) => onInputChange('avgChatResolutionTime', parseInt(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
