
export interface LeadFormData {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  website: string;
  industry: string;
  employeeCount: number;
}

export interface LeadFormProps {
  onSubmit: (data: LeadFormData) => void;
}
