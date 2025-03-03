
import { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getTierDisplayName } from "@/components/calculator/pricingDetailsCalculator";
import { useCalculator, type CalculatorInputs } from "@/hooks/useCalculator";
import { AI_RATES } from "@/constants/pricing";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const EditLeadDialog = ({ lead, open, onClose }: EditLeadDialogProps) => {
  const [updatedLead, setUpdatedLead] = useState<Lead>({...lead});
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a CalculatorInputs object from the lead's calculator_inputs
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>(
    lead.calculator_inputs || {
      aiType: 'chatbot',
      aiTier: 'starter',
      role: 'customerService',
      numEmployees: lead.employee_count || 5,
      callVolume: 0,
      avgCallDuration: 4.5,
      chatVolume: 5000,
      avgChatLength: 8,
      avgChatResolutionTime: 10,
    }
  );
  
  // Use the calculator hook to get updated calculations
  const calculationResults = useCalculator(calculatorInputs);
  
  // Update the lead's calculator_results whenever calculationResults changes
  useEffect(() => {
    setUpdatedLead(prev => ({
      ...prev,
      calculator_results: calculationResults
    }));
  }, [calculationResults]);

  // Handle basic lead info changes
  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setUpdatedLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle calculator input changes
  const handleCalculatorInputChange = (field: string, value: any) => {
    setCalculatorInputs(prev => {
      const updatedInputs = { ...prev, [field]: value } as CalculatorInputs;
      
      // If changing to starter plan, ensure call volume is 0
      if (field === 'aiTier' && value === 'starter') {
        updatedInputs.callVolume = 0;
      }
      // If changing to a plan with voice, ensure call volume is at least the included minutes
      else if (field === 'aiTier' && value !== 'starter') {
        const includedMinutes = AI_RATES.chatbot[value as keyof typeof AI_RATES.chatbot]?.includedVoiceMinutes || 0;
        if (updatedInputs.callVolume < includedMinutes) {
          updatedInputs.callVolume = includedMinutes;
        }
      }
      
      return updatedInputs;
    });
    
    // Also update the calculator_inputs in the updatedLead
    setUpdatedLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...prev.calculator_inputs,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Make sure the latest calculator inputs and results are saved
      const finalLeadData = {
        ...updatedLead,
        calculator_inputs: calculatorInputs,
        calculator_results: calculationResults
      };
      
      // Update lead in the database
      const { error } = await supabase
        .from('leads')
        .update({
          name: finalLeadData.name,
          company_name: finalLeadData.company_name,
          email: finalLeadData.email,
          phone_number: finalLeadData.phone_number,
          website: finalLeadData.website,
          industry: finalLeadData.industry,
          employee_count: finalLeadData.employee_count,
          calculator_inputs: finalLeadData.calculator_inputs,
          calculator_results: finalLeadData.calculator_results,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated with recalculated values.",
      });
      
      onClose();
    } catch (error: any) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead: {lead.company_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="calculator">Calculator Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name</Label>
                <Input
                  id="name"
                  value={updatedLead.name}
                  onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={updatedLead.company_name}
                  onChange={(e) => handleBasicInfoChange('company_name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={updatedLead.email}
                  onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={updatedLead.phone_number || ''}
                  onChange={(e) => handleBasicInfoChange('phone_number', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={updatedLead.website || ''}
                  onChange={(e) => handleBasicInfoChange('website', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={updatedLead.industry || ''}
                  onChange={(e) => handleBasicInfoChange('industry', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input
                  id="employee_count"
                  type="number"
                  value={updatedLead.employee_count || ''}
                  onChange={(e) => handleBasicInfoChange('employee_count', Number(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="calculator" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aiTier">AI Plan Tier</Label>
                <Select
                  value={calculatorInputs.aiTier || 'starter'}
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
                  Current: {getTierDisplayName(calculatorInputs.aiTier || 'starter')}
                </p>
                {calculatorInputs.aiTier !== 'starter' && (
                  <p className="text-xs text-green-600 mt-1">
                    Includes {AI_RATES.chatbot[calculatorInputs.aiTier].includedVoiceMinutes || 0} free voice minutes
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
                    <SelectItem value="voice">Basic Voice Only</SelectItem>
                    <SelectItem value="conversationalVoice">Conversational Voice Only</SelectItem>
                    <SelectItem value="both">Text & Basic Voice</SelectItem>
                    <SelectItem value="both-premium">Text & Conversational Voice</SelectItem>
                  </SelectContent>
                </Select>
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
                  disabled={calculatorInputs.aiTier === 'starter'} // Disable for starter plan
                />
                {calculatorInputs.aiTier !== 'starter' && (
                  <p className="text-xs text-green-600 mt-1">
                    {AI_RATES.chatbot[calculatorInputs.aiTier].includedVoiceMinutes || 0} minutes included free
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
                  disabled={calculatorInputs.aiTier === 'starter'} // Disable for starter plan
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
            
            {/* Summary of recalculated values */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Recalculated Values Preview:</h3>
              <div className="text-sm grid grid-cols-2 gap-2">
                <div>Monthly AI Cost:</div>
                <div className="font-medium">${calculationResults.aiCostMonthly.total.toFixed(2)}</div>
                
                <div>Setup Fee:</div>
                <div className="font-medium">${calculationResults.aiCostMonthly.setupFee.toFixed(2)}</div>
                
                <div>Monthly Savings:</div>
                <div className="font-medium text-green-600">${calculationResults.monthlySavings.toFixed(2)}</div>
                
                <div>Savings Percentage:</div>
                <div className="font-medium text-green-600">{calculationResults.savingsPercentage.toFixed(1)}%</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
