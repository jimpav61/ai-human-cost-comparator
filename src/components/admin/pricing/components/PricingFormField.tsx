
import React from 'react';
import { Input } from "@/components/ui/input";

interface PricingFormFieldProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  min?: string;
}

export const PricingFormField = ({ 
  label, 
  value, 
  onChange, 
  step = "1", 
  min = "0" 
}: PricingFormFieldProps) => {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        {label}
      </label>
      <Input
        type="number"
        value={value}
        onChange={onChange}
        step={step}
        min={min}
      />
    </div>
  );
};
