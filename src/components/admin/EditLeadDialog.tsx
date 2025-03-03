
import { useState } from "react";
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

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onClose: () => void;
}

export const EditLeadDialog = ({ lead, open, onClose }: EditLeadDialogProps) => {
  const [updatedLead, setUpdatedLead] = useState<Lead>({...lead});
  const [isLoading, setIsLoading] = useState(false);

  // Handle basic lead info changes
  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setUpdatedLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle calculator input changes
  const handleCalculatorInputChange = (field: string, value: any) => {
    const inputs = updatedLead.calculator_inputs || {};
    setUpdatedLead(prev => ({
      ...prev,
      calculator_inputs: {
        ...inputs,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Update lead in the database
      const { error } = await supabase
        .from('leads')
        .update({
          name: updatedLead.name,
          company_name: updatedLead.company_name,
          email: updatedLead.email,
          phone_number: updatedLead.phone_number,
          website: updatedLead.website,
          industry: updatedLead.industry,
          employee_count: updatedLead.employee_count,
          calculator_inputs: updatedLead.calculator_inputs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Lead updated",
        description: "The lead has been successfully updated.",
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
                  value={(updatedLead.calculator_inputs?.aiTier || 'starter')}
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
                  Current: {getTierDisplayName(updatedLead.calculator_inputs?.aiTier || 'starter')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aiType">AI Type</Label>
                <Select
                  value={updatedLead.calculator_inputs?.aiType || 'chatbot'}
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
                  value={updatedLead.calculator_inputs?.numEmployees || ''}
                  onChange={(e) => handleCalculatorInputChange('numEmployees', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Employee Role</Label>
                <Select
                  value={updatedLead.calculator_inputs?.role || 'customerService'}
                  onValueChange={(value) => handleCalculatorInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customerService">Customer Service</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="support">Technical Support</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chatVolume">Monthly Chat Volume</Label>
                <Input
                  id="chatVolume"
                  type="number"
                  value={updatedLead.calculator_inputs?.chatVolume || ''}
                  onChange={(e) => handleCalculatorInputChange('chatVolume', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avgChatLength">Average Chat Length (messages)</Label>
                <Input
                  id="avgChatLength"
                  type="number"
                  value={updatedLead.calculator_inputs?.avgChatLength || ''}
                  onChange={(e) => handleCalculatorInputChange('avgChatLength', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="callVolume">Monthly Call Volume</Label>
                <Input
                  id="callVolume"
                  type="number"
                  value={updatedLead.calculator_inputs?.callVolume || ''}
                  onChange={(e) => handleCalculatorInputChange('callVolume', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avgCallDuration">Average Call Duration (minutes)</Label>
                <Input
                  id="avgCallDuration"
                  type="number"
                  value={updatedLead.calculator_inputs?.avgCallDuration || ''}
                  onChange={(e) => handleCalculatorInputChange('avgCallDuration', Number(e.target.value))}
                />
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
