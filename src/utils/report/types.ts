
import { Lead } from "@/types/leads";
import { jsPDF } from "jspdf";

export interface ReportGenerationResult {
  success: boolean;
  message: string;
  reportId?: string;
  pdfUrl?: string;
  pdfDoc?: jsPDF; // Add this property to fix the type error
}

export interface ReportData {
  id: string;
  lead_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone_number?: string | null;
  calculator_inputs: any;
  calculator_results: any;
  report_date: string;
  version?: number;
}

export interface GenerateReportOptions {
  skipStorage?: boolean;
  retryCount?: number;
}
