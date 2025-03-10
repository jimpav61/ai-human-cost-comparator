
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorInputs } from "@/hooks/calculator/types";

interface PlanSelectorProps {
  value: CalculatorInputs['aiTier'];
  onChange: (value: string) => void;
}

export const PlanSelector = ({ value, onChange }: PlanSelectorProps) => {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="aiTier" className="col-span-1">Plan</Label>
      <Select 
        value={value} 
        onValueChange={onChange}
      >
        <SelectTrigger id="aiTier" className="col-span-3">
          <SelectValue placeholder="Select plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="starter">Starter Plan</SelectItem>
          <SelectItem value="growth">Growth Plan</SelectItem>
          <SelectItem value="premium">Premium Plan</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
