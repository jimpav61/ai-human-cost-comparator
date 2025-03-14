
import jsPDF from 'jspdf';
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { SharedResults } from "../../types";

// Export the jsPDF type for use in other files
declare global {
  // Augment the global scope if needed
}

// Define ProcessedLeadData type for use in other files
export interface ProcessedLeadData {
  // Contact and company information
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  employeeCount: number;
  
  // Calculator results
  results: SharedResults;
  
  // Plan details
  tierName: string;
  aiType: string;
  
  // Voice minutes data
  additionalVoiceMinutes: number;
  includedVoiceMinutes: number;
  
  // Content suggestions
  businessSuggestions: Array<{
    title: string;
    description: string;
  }>;
  aiPlacements: Array<{
    role: string;
    capabilities: string[];
  }>;
}

// Re-export types that might be needed
export type { JsPDFWithAutoTable };
