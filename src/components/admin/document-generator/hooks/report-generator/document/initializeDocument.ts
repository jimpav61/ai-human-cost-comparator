
import { JsPDFWithAutoTable } from '@/components/calculator/pdf/types';
import jsPDF from 'jspdf';

export const initializeDocument = (): JsPDFWithAutoTable => {
  console.log("Initializing PDF document");
  return new jsPDF() as JsPDFWithAutoTable;
};
