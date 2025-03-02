
import { CardContent } from "@/components/ui/card";
import { Lead } from "@/types/leads";
import { CompanyDisplay } from "../CompanyDisplay";
import { ContactDisplay } from "../ContactDisplay";
import { DateDisplay } from "../DateDisplay";
import { DocumentGenerator } from "../DocumentGenerator";

interface LeadMobileCardProps {
  lead: Lead;
}

export const LeadMobileCard = ({ lead }: LeadMobileCardProps) => {
  return (
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
          <DocumentGenerator lead={lead} />
        </div>
      </div>
    </CardContent>
  );
};
