
import { Lead } from "@/types/leads";
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import { getSafeFileName } from "./fileNameUtils";
import { saveReportPDF } from "./savePDFFile";

// Re-export the functions from the smaller files
export { getSafeFileName };
export { saveReportPDF };
