import React from 'react';
import { ROLE_LABELS } from '@/constants/pricing';
import type { CalculatorInputs } from '@/hooks/useCalculator';

interface CalculatorFormProps {
  inputs: CalculatorInputs;
  onInputChange: (field: keyof CalculatorInputs, value: any) => void;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({ inputs, onInputChange }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="calculator-card">
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
        
        {/* AI Type Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Type</label>
          <select 
            value={inputs.aiType}
            onChange={(e) => onInputChange('aiType', e.target.value)}
            className="calculator-input"
          >
            <option value="voice">Voice AI</option>
            <option value="chatbot">Chatbot</option>
            <option value="both">Both</option>
          </select>
        </div>
        
        {/* AI Tier Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">AI Tier</label>
          <select 
            value={inputs.aiTier}
            onChange={(e) => onInputChange('aiTier', e.target.value)}
            className="calculator-input"
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        
        {(inputs.aiType === 'voice' || inputs.aiType === 'both') && (
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
        
        {(inputs.aiType === 'chatbot' || inputs.aiType === 'both') && (
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
        
        {/* Advanced Settings */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-4">Business Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Employees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Number of Employees
              </label>
              <input 
                type="number" 
                min="1"
                value={inputs.numEmployees}
                onChange={(e) => onInputChange('numEmployees', parseInt(e.target.value) || 1)}
                className="calculator-input"
              />
            </div>
            
            {/* Weekly Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Work Hours
              </label>
              <input 
                type="number" 
                min="1" 
                max="168"
                value={inputs.workHoursPerWeek}
                onChange={(e) => onInputChange('workHoursPerWeek', parseInt(e.target.value) || 0)}
                className="calculator-input"
              />
            </div>
            
            {/* AI Utilization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Utilization Level
              </label>
              <select
                value={inputs.employeeUtilization}
                onChange={(e) => onInputChange('employeeUtilization', parseInt(e.target.value))}
                className="calculator-input"
              >
                <option value={25}>25% - Basic Integration</option>
                <option value={50}>50% - Moderate Integration</option>
                <option value={75}>75% - Advanced Integration</option>
                <option value={100}>100% - Full Integration</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
