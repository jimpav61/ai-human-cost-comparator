
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  autoTable: Function;
  lastAutoTable?: {
    finalY?: number;
  };
}
