
import { useState } from "react";

export const useLeadExpansion = () => {
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});

  const toggleLeadExpansion = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  return {
    expandedLeads,
    toggleLeadExpansion
  };
};
