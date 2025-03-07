
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Lead } from "@/types/leads";
import { CompanyDisplay } from "../../CompanyDisplay";
import { ContactDisplay } from "../../ContactDisplay";
import { DateDisplay } from "../../DateDisplay";
import { DocumentGenerator } from "../../DocumentGenerator";

interface MobileLeadsViewProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

export const MobileLeadsView = ({ leads, onEdit }: MobileLeadsViewProps) => {
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});

  const toggleLeadExpansion = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  return (
    <div className="block md:hidden">
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
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Company</div>
                    <CompanyDisplay 
                      companyName={lead.company_name}
                      website={lead.website}
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Contact</div>
                    <div>{lead.name}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Industry</div>
                    <div>{lead.industry || "N/A"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Size</div>
                    <div>{lead.employee_count || "N/A"}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Contact Info</div>
                    <ContactDisplay
                      email={lead.email}
                      phoneNumber={lead.phone_number}
                    />
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500">Created</div>
                    <DateDisplay dateString={lead.created_at} />
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Actions</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(lead);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <DocumentGenerator lead={lead} />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
