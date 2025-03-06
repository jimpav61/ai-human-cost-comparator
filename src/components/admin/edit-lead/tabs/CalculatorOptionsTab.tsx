
import { CalculatorInputs } from "@/hooks/useCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/utils/formatters";

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
  // Ensure we have a valid tier value
  const currentTier = calculatorInputs?.aiTier || 'starter';
  
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
  const callVolume = calculatorInputs?.callVolume || 0;
  const additionalVoiceCost = callVolume * 0.12;
  const includedVoiceMinutes = getIncludedVoiceMinutes();
  
  // Get current monthly costs for display
  const basePrice = currentTier === 'starter' ? 99 : 
                   currentTier === 'growth' ? 229 : 
                   currentTier === 'premium' ? 429 : 229;
  const totalMonthlyCost = basePrice + additionalVoiceCost;

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Plan Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <Label htmlFor="aiTier" className="text-sm font-medium">AI Plan Tier</Label>
            <Select
              value={currentTier}
              onValueChange={(value) => handleCalculatorInputChange('aiTier', value)}
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
              value={calculatorInputs?.aiType || 'chatbot'}
              onValueChange={(value) => handleCalculatorInputChange('aiType', value)}
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
            {currentTier === 'starter' && calculatorInputs?.aiType !== 'chatbot' && (
              <p className="text-xs text-amber-600 mt-1">
                Starter Plan only supports text capabilities
              </p>
            )}
            {currentTier !== 'premium' && (calculatorInputs?.aiType === 'conversationalVoice' || calculatorInputs?.aiType === 'both-premium') && (
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
              onChange={(e) => handleCalculatorInputChange('numEmployees', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-medium">Employee Role</Label>
            <Select
              value={calculatorInputs?.role || 'customerService'}
              onValueChange={(value) => handleCalculatorInputChange('role', value)}
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
              onChange={(e) => handleCalculatorInputChange('chatVolume', Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="callVolume" className="text-sm font-medium">Additional Voice Minutes</Label>
            <Select
              value={(calculatorInputs?.callVolume || 0).toString()}
              onValueChange={(value) => handleCalculatorInputChange('callVolume', Number(value))}
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
