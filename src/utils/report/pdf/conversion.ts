
import { jsPDF } from "jspdf";

/**
 * Convert PDF document to Blob for storage
 */
export async function convertPDFToBlob(pdfDoc: jsPDF): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Output the PDF as a blob directly
      const pdfOutput = pdfDoc.output('blob');
      resolve(pdfOutput);
    } catch (error) {
      reject(error);
    }
  });
}
