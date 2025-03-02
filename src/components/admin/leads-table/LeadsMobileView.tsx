
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Lead } from "@/types/leads";
import { useLeadExpansion } from "./hooks/useLeadExpansion";
import { LeadMobileCard } from "./LeadMobileCard";

interface LeadsMobileViewProps {
  leads: Lead[];
}

export const LeadsMobileView = ({ leads }: LeadsMobileViewProps) => {
  const { expandedLeads, toggleLeadExpansion } = useLeadExpansion();

  return (
    <div className="space-y-4 p-3">
      {leads.map((lead) => (
        <Card key={lead.id} className="overflow-hidden">
          <div 
            className="p-4 border-b flex justify-between items-center cursor-pointer bg-gray-50"
            onClick={() => toggleLeadExpansion(lead.id)}
          >
            <div>
              <div className="font-medium">{lead.company_name}</div>
              <div className="text-sm text-gray-500">{lead.name}</div>
            </div>
            {expandedLeads[lead.id] ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {expandedLeads[lead.id] && (
            <LeadMobileCard lead={lead} />
          )}
        </Card>
      ))}
    </div>
  );
};
