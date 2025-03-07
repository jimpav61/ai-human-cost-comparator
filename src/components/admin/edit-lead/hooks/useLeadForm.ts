
import { useState } from 'react';
import { Lead } from "@/types/leads";

export function useLeadForm(initialLead: Lead) {
  const [formData, setFormData] = useState<Lead>(initialLead);

  // Handle changes to basic lead information
  const handleBasicInfoChange = (field: keyof Lead, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    handleBasicInfoChange,
    setFormData
  };
}
