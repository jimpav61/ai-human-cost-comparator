
import { Lead } from "@/types/leads";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BasicInfoTabProps {
  formData: Lead;
  handleBasicInfoChange: (field: keyof Lead, value: string | number) => void;
}

export const BasicInfoTab = ({ formData, handleBasicInfoChange }: BasicInfoTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Contact Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleBasicInfoChange('name', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => handleBasicInfoChange('company_name', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleBasicInfoChange('email', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          value={formData.phone_number || ''}
          onChange={(e) => handleBasicInfoChange('phone_number', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website || ''}
          onChange={(e) => handleBasicInfoChange('website', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input
          id="industry"
          value={formData.industry || ''}
          onChange={(e) => handleBasicInfoChange('industry', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="employee_count">Employee Count</Label>
        <Input
          id="employee_count"
          type="number"
          value={formData.employee_count || ''}
          onChange={(e) => handleBasicInfoChange('employee_count', Number(e.target.value))}
        />
      </div>
    </div>
  );
};
