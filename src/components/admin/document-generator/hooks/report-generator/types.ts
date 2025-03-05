
import jsPDF from 'jspdf';
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';

// Export the jsPDF type for use in other files
declare global {
  // Augment the global scope if needed
}

// Re-export types that might be needed
export type { JsPDFWithAutoTable };
