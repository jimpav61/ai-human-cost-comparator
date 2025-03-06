
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { FileText, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Lead } from "@/types/leads";
import { CompanyDisplay } from "./CompanyDisplay";
import { ContactDisplay } from "./ContactDisplay";
import { DateDisplay } from "./DateDisplay";
import { DocumentGenerator } from "./DocumentGenerator";
import { exportLeadsToCSV } from "@/utils/exportUtils";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EditLeadDialog } from "./edit-lead/EditLeadDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated?: () => void; // Add callback for when a lead is updated
}

export const LeadsTable = ({ leads, onLeadUpdated }: LeadsTableProps) => {
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const toggleLeadExpansion = (leadId: string) => {
    setExpandedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const handleOpenEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingLead(null);
  };

  const handleSaveLead = async (updatedLead: Lead) => {
    try {
      console.log("Saving updated lead:", updatedLead);
      
      // Update the lead in the database
      const { error } = await supabase
        .from('leads')
        .update({
          name: updatedLead.name,
          company_name: updatedLead.company_name,
          email: updatedLead.email,
          phone_number: updatedLead.phone_number,
          industry: updatedLead.industry,
          employee_count: updatedLead.employee_count,
          website: updatedLead.website,
          calculator_inputs: updatedLead.calculator_inputs,
          calculator_results: updatedLead.calculator_results
        })
        .eq('id', updatedLead.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Lead updated successfully",
        variant: "default",
      });
      
      // Call the onLeadUpdated callback if provided
      if (onLeadUpdated) {
        onLeadUpdated();
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: `Failed to update lead: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Lead Management</h2>
        <Button 
          onClick={() => exportLeadsToCSV(leads)}
          className="flex items-center gap-2"
        >
          <FileText size={16} />
          Export All to CSV
        </Button>
      </div>
      
      {/* Desktop View - Traditional Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <CompanyDisplay 
                    companyName={lead.company_name}
                    website={lead.website}
                  />
                </TableCell>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.industry || "N/A"}</TableCell>
                <TableCell>{lead.employee_count || "N/A"}</TableCell>
                <TableCell>
                  <ContactDisplay
                    email={lead.email}
                    phoneNumber={lead.phone_number}
                  />
                </TableCell>
                <TableCell>
                  <DateDisplay dateString={lead.created_at} />
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditDialog(lead)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <DocumentGenerator lead={lead} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Card Layout */}
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
                            handleOpenEditDialog(lead);
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

      {/* Edit Lead Dialog */}
      {editingLead && (
        <EditLeadDialog
          lead={editingLead}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onSave={handleSaveLead}
        />
      )}
    </div>
  );
};
