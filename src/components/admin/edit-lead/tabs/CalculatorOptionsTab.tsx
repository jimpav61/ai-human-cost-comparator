
import { CalculatorInputs } from "@/hooks/useCalculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTierDisplayName } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";

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
  const currentTier = calculatorInputs.aiTier || 'starter';
  
  // Safely get the included voice minutes, with fallback to 0
  const getIncludedVoiceMinutes = () => {
    if (currentTier === 'starter') return 0;
    try {
      return AI_RATES.chatbot[currentTier]?.includedVoiceMinutes || 600;
    } catch (error) {
      console.error("Error getting included voice minutes:", error);
      return 600; // Default for growth/premium tiers
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="aiTier">AI Plan Tier</Label>
          <Select
            value={currentTier}
            onValueChange={(value) => handleCalculatorInputChange('aiTier', value)}
          >
            <SelectTrigger>
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
              Includes {getIncludedVoiceMinutes()} free voice minutes
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="aiType">AI Type</Label>
          <Select
            value={calculatorInputs.aiType || 'chatbot'}
            onValueChange={(value) => handleCalculatorInputChange('aiType', value)}
          >
            <SelectTrigger>
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
          {currentTier === 'starter' && calculatorInputs.aiType !== 'chatbot' && (
            <p className="text-xs text-amber-600 mt-1">
              Starter Plan only supports text capabilities
            </p>
          )}
          {currentTier !== 'premium' && (calculatorInputs.aiType === 'conversationalVoice' || calculatorInputs.aiType === 'both-premium') && (
            <p className="text-xs text-amber-600 mt-1">
              Conversational voice requires Premium Plan
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="numEmployees">Number of Employees</Label>
          <Input
            id="numEmployees"
            type="number"
            value={calculatorInputs.numEmployees || ''}
            onChange={(e) => handleCalculatorInputChange('numEmployees', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Employee Role</Label>
          <Select
            value={calculatorInputs.role || 'customerService'}
            onValueChange={(value) => handleCalculatorInputChange('role', value)}
          >
            <SelectTrigger>
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
        
        <div className="space-y-2">
          <Label htmlFor="chatVolume">Monthly Chat Volume</Label>
          <Input
            id="chatVolume"
            type="number"
            value={calculatorInputs.chatVolume || ''}
            onChange={(e) => handleCalculatorInputChange('chatVolume', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="avgChatLength">Average Chat Length (messages)</Label>
          <Input
            id="avgChatLength"
            type="number"
            value={calculatorInputs.avgChatLength || ''}
            onChange={(e) => handleCalculatorInputChange('avgChatLength', Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="callVolume">Monthly Call Volume</Label>
          <Input
            id="callVolume"
            type="number"
            value={calculatorInputs.callVolume || ''}
            onChange={(e) => handleCalculatorInputChange('callVolume', Number(e.target.value))}
            disabled={currentTier === 'starter'}
          />
          {currentTier !== 'starter' && (
            <p className="text-xs text-green-600 mt-1">
              {getIncludedVoiceMinutes()} minutes included free
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="avgCallDuration">Average Call Duration (minutes)</Label>
          <Input
            id="avgCallDuration"
            type="number"
            value={calculatorInputs.avgCallDuration || ''}
            onChange={(e) => handleCalculatorInputChange('avgCallDuration', Number(e.target.value))}
            disabled={currentTier === 'starter'}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="avgChatResolutionTime">Average Chat Resolution Time (minutes)</Label>
          <Input
            id="avgChatResolutionTime"
            type="number"
            value={calculatorInputs.avgChatResolutionTime || ''}
            onChange={(e) => handleCalculatorInputChange('avgChatResolutionTime', Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recalculated Values Preview:</h3>
        <div className="text-sm grid grid-cols-2 gap-2">
          <div>Monthly AI Cost:</div>
          <div className="font-medium">${safeFormatNumber(calculationResults?.aiCostMonthly?.total || 0)}</div>
          
          <div>Setup Fee:</div>
          <div className="font-medium">${safeFormatNumber(calculationResults?.aiCostMonthly?.setupFee || 0)}</div>
          
          <div>Monthly Savings:</div>
          <div className="font-medium text-green-600">${safeFormatNumber(calculationResults?.monthlySavings || 0)}</div>
          
          <div>Savings Percentage:</div>
          <div className="font-medium text-green-600">{safeFormatNumber(calculationResults?.savingsPercentage || 0)}%</div>
        </div>
      </div>
    </>
  );
};
