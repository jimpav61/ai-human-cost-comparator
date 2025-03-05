
import { generatePDF as generatePDFModular } from './pdf';
import type { GeneratePDFParams } from './pdf/types';

export const generatePDF = (params: GeneratePDFParams) => {
  return generatePDFModular(params);
};
