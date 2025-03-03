
import jsPDF from 'jspdf';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

export interface SectionParams {
  contactInfo?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string | null;
  industry?: string;
  employeeCount?: number;
  results?: any;
  tierName?: string;
  aiType?: string;
  pricingDetails?: any[];
}
