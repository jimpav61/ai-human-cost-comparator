
import { CalculatorInputs } from "@/hooks/useCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { useEffect, useState } from "react";

interface CalculatorOptionsTabProps {
  calculatorInputs: CalculatorInputs;
  handleCalculatorInputChange: (field: string, value: any) => void;
  calculationResults: any;
  safeFormatNumber: (value: number | undefined) => string;
}

export const CalculatorOptionsTab = ({ 
  calculatorInputs, 
  handleCalculatorInputChange,
  calculationResults,
  safeFormatNumber
}: CalculatorOptionsTabProps) => {
  // Debug state
  const [lastChange, setLastChange] = useState<string>("none");
  
  // Ensure we have a valid tier value and callVolume is a number
  const currentTier = calculatorInputs?.aiTier || 'starter';
  const currentAIType = calculatorInputs?.aiType || 'chatbot';
  
  // Log for debugging
  console.log("CalculatorOptionsTab calculatorInputs:", calculatorInputs);
  console.log("CalculatorOptionsTab calculationResults:", calculationResults);
  console.log("CalculatorOptionsTab last change:", lastChange);
  
  // CRITICAL FIX: Try to get callVolume from multiple possible sources
  let currentCallVolume: number;
  
  // First check calculator_inputs
  if (typeof calculatorInputs?.callVolume === 'number') {
    currentCallVolume = calculatorInputs.callVolume;
  } else if (typeof calculatorInputs?.callVolume === 'string') {
    currentCallVolume = parseInt(calculatorInputs.callVolume, 10) || 0;
  } 
  // Then check calculator_results.additionalVoiceMinutes
  else if (calculationResults?.additionalVoiceMinutes !== undefined) {
    currentCallVolume = calculationResults.additionalVoiceMinutes;
    // Also update the calculator inputs to match
    if (calculatorInputs.callVolume !== currentCallVolume) {
      console.log("Updating calculatorInputs.callVolume to match additionalVoiceMinutes:", currentCallVolume);
      handleCalculatorInputChange('callVolume', currentCallVolume);
    }
  }
  else {
    currentCallVolume = 0;
  }
  
  console.log("Using currentCallVolume:", currentCallVolume);
  
  // Handle changes to AI tier to ensure AI type stays consistent
  useEffect(() => {
    // If tier changed to premium, upgrade voice capabilities if applicable
    if (currentTier === 'premium') {
      if (currentAIType === 'voice') {
        console.log("CalculatorOptionsTab: Upgraded to premium, enhancing to conversational voice");
        handleCalculatorInputChange('aiType', 'conversationalVoice');
        setLastChange("tier-premium-voice-upgrade");
      } 
      else if (currentAIType === 'both') {
        console.log("CalculatorOptionsTab: Upgraded to premium, enhancing to premium voice features");
        handleCalculatorInputChange('aiType', 'both-premium');
        setLastChange("tier-premium-both-upgrade");
      }
    }
    // If downgraded from premium and using premium features, downgrade features
    else if (currentTier === 'growth') {
      if (currentAIType === 'conversationalVoice') {
        console.log("CalculatorOptionsTab: Downgraded to growth, changing to basic voice");
        handleCalculatorInputChange('aiType', 'voice');
        setLastChange("tier-growth-voice-downgrade");
      } 
      else if (currentAIType === 'both-premium') {
        console.log("CalculatorOptionsTab: Downgraded to growth, changing to basic voice features");
        handleCalculatorInputChange('aiType', 'both');
        setLastChange("tier-growth-both-downgrade");
      }
      // Important fix: Make sure growth plan has appropriate capabilities (at least both)
      else if (currentAIType === 'chatbot') {
        console.log("CalculatorOptionsTab: On growth plan, enhancing to text & basic voice");
        handleCalculatorInputChange('aiType', 'both');
        setLastChange("tier-growth-chatbot-upgrade");
      }
    }
    // If downgraded to starter, force chatbot
    else if (currentTier === 'starter') {
      if (currentAIType !== 'chatbot') {
        console.log("CalculatorOptionsTab: Downgraded to starter, forcing chatbot only");
        handleCalculatorInputChange('aiType', 'chatbot');
        handleCalculatorInputChange('callVolume', 0);
        setLastChange("tier-starter-force-chatbot");
      }
    }
  }, [currentTier, currentAIType, handleCalculatorInputChange]);
  
  // Safely get the included voice minutes, with fallback to 0
  const getIncludedVoiceMinutes = () => {
    if (currentTier === 'starter') return 0;
    try {
      return AI_RATES?.chatbot?.[currentTier]?.includedVoiceMinutes || 600;
    } catch (error) {
      console.error("Error getting included voice minutes:", error);
      return 600; // Default for growth/premium tiers
    }
  };
  
  // Create preset volume options in increments of 50
  const volumeOptions = Array.from({ length: 21 }, (_, i) => i * 50);
  
  // Calculate the additional voice cost
  const callVolume = currentCallVolume || 0;
  const additionalVoiceCost = callVolume * 0.12;
  const includedVoiceMinutes = getIncludedVoiceMinutes();
  
  // Get current monthly costs for display
  const basePrice = currentTier === 'starter' ? 99 : 
                   currentTier === 'growth' ? 229 : 
                   currentTier === 'premium' ? 429 : 229;
  const totalMonthlyCost = basePrice + additionalVoiceCost;
  
  // Handle tier change with proper AI type adjustment
  const handleTierChange = (newTier: string) => {
    console.log(`Changing tier from ${currentTier} to ${newTier}`);
    setLastChange(`tier-change-${newTier}`);
    
    // First update the tier - useEffect will handle AI type adjustments
    handleCalculatorInputChange('aiTier', newTier);
  };
  
  // Handle AI type change with proper tier adjustment
  const handleAITypeChange = (newType: string) => {
    console.log(`Changing AI type from ${currentAIType} to ${newType}`);
    setLastChange(`aitype-change-${newType}`);
    
    // If selecting premium voice features, upgrade tier if needed
    if ((newType === 'conversationalVoice' || newType === 'both-premium') && currentTier !== 'premium') {
      console.log("Upgrading to premium tier for conversational voice");
      handleCalculatorInputChange('aiTier', 'premium');
    }
    // If selecting basic voice features on starter, upgrade to growth
    else if ((newType === 'voice' || newType === 'both') && currentTier === 'starter') {
      console.log("Upgrading to growth tier for voice capabilities");
      handleCalculatorInputChange('aiTier', 'growth');
    }
    
    // Update the AI type
    handleCalculatorInputChange('aiType', newType);
  };
  
  // Handle call volume change - ensure it's stored as a number
  const handleCallVolumeChange = (value: string) => {
    const numericValue = parseInt(value, 10) || 0;
    console.log(`Changing call volume from ${callVolume} to ${numericValue}`);
    setLastChange(`callvolume-change-${numericValue}`);
    handleCalculatorInputChange('callVolume', numericValue);
  };
  
  // Handle chat volume change
  const handleChatVolumeChange = (value: number) => {
    console.log(`Changing chat volume to ${value}`);
    setLastChange(`chatvolume-change-${value}`);
    handleCalculatorInputChange('chatVolume', value);
  };
  
  // Handle number of employees change
  const handleEmployeeCountChange = (value: number) => {
    console.log(`Changing employee count to ${value}`);
    setLastChange(`employees-change-${value}`);
    handleCalculatorInputChange('numEmployees', value);
  };
  
  // Handle role change
  const handleRoleChange = (value: string) => {
    console.log(`Changing role to ${value}`);
    setLastChange(`role-change-${value}`);
    handleCalculatorInputChange('role', value);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Plan Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <Label htmlFor="aiTier" className="text-sm font-medium">AI Plan Tier</Label>
            <Select
              value={currentTier}
              onValueChange={handleTierChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter Plan (Text Only)</SelectItem>
                <SelectItem value="growth">Growth Plan (Text & Basic Voice)</SelectItem>
                <SelectItem value="premium">Premium Plan (Text & Conversational Voice)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Current: {getTierDisplayName(currentTier)}
            </p>
            {currentTier !== 'starter' && (
              <p className="text-xs text-green-600 mt-1">
                Includes {includedVoiceMinutes} free voice minutes
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="aiType" className="text-sm font-medium">AI Type</Label>
            <Select
              value={currentAIType}
              onValueChange={handleAITypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select AI type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatbot">Text Only</SelectItem>
                <SelectItem value="voice" disabled={currentTier === 'starter'}>Basic Voice Only</SelectItem>
                <SelectItem value="conversationalVoice" disabled={currentTier !== 'premium'}>Conversational Voice Only</SelectItem>
                <SelectItem value="both" disabled={currentTier === 'starter'}>Text & Basic Voice</SelectItem>
                <SelectItem value="both-premium" disabled={currentTier !== 'premium'}>Text & Conversational Voice</SelectItem>
              </SelectContent>
            </Select>
            {currentTier === 'starter' && currentAIType !== 'chatbot' && (
              <p className="text-xs text-amber-600 mt-1">
                Starter Plan only supports text capabilities
              </p>
            )}
            {currentTier !== 'premium' && (currentAIType === 'conversationalVoice' || currentAIType === 'both-premium') && (
              <p className="text-xs text-amber-600 mt-1">
                Conversational voice requires Premium Plan
              </p>
            )}
          </div>
        </div>
      </Card>
      
      <Card className="p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <Label htmlFor="numEmployees" className="text-sm font-medium">Number of Employees</Label>
            <Input
              id="numEmployees"
              type="number"
              value={calculatorInputs?.numEmployees || ''}
              onChange={(e) => handleEmployeeCountChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">Employee Role</Label>
            <Select
              value={calculatorInputs?.role || 'customerService'}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customerService">Customer Service</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="technicalSupport">Technical Support</SelectItem>
                <SelectItem value="generalAdmin">Administrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Volume Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <Label htmlFor="chatVolume" className="text-sm font-medium">Monthly Chat Volume</Label>
            <Input
              id="chatVolume"
              type="number"
              value={calculatorInputs?.chatVolume || ''}
              onChange={(e) => handleChatVolumeChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="callVolume" className="text-sm font-medium">Additional Voice Minutes</Label>
            <Select
              value={callVolume.toString()}
              onValueChange={handleCallVolumeChange}
              disabled={currentTier === 'starter'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select volume" />
              </SelectTrigger>
              <SelectContent>
                {volumeOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTier !== 'starter' && (
              <p className="text-xs text-green-600 mt-1">
                {includedVoiceMinutes} minutes included free
              </p>
            )}
            {currentTier !== 'starter' && callVolume > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {callVolume} additional minutes at 12¢/min = {formatCurrency(additionalVoiceCost)}
              </p>
            )}
          </div>
        </div>
      </Card>
      
      <Card className="p-4 shadow-sm bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
        <div className="text-sm grid grid-cols-2 gap-3">
          <div>Plan Base Rate:</div>
          <div className="font-medium">{formatCurrency(basePrice)}/month</div>
          
          {currentTier !== 'starter' && (
            <>
              <div>Included Voice Minutes:</div>
              <div className="font-medium">{formatNumber(includedVoiceMinutes)} minutes</div>
              
              {callVolume > 0 && (
                <>
                  <div>Additional Voice Minutes:</div>
                  <div className="font-medium">{formatNumber(callVolume)} minutes</div>
                  
                  <div>Additional Voice Cost:</div>
                  <div className="font-medium">{formatCurrency(additionalVoiceCost)}/month</div>
                </>
              )}
            </>
          )}
          
          <div className="font-medium text-brand-600">Total Monthly Cost:</div>
          <div className="font-medium text-brand-600">{formatCurrency(totalMonthlyCost)}/month</div>
          
          <div>Setup Fee:</div>
          <div className="font-medium">{formatCurrency(calculationResults?.aiCostMonthly?.setupFee || 0)}</div>
          
          <div className="mt-3 font-medium text-green-600">Monthly Savings:</div>
          <div className="mt-3 font-medium text-green-600">{formatCurrency(calculationResults?.monthlySavings || 0)}</div>
          
          <div>Savings Percentage:</div>
          <div className="font-medium text-green-600">{safeFormatNumber(calculationResults?.savingsPercentage || 0)}%</div>
        </div>
      </Card>
    </div>
  );
};
