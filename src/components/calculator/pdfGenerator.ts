
// Re-export the generatePDF function and types from the new module
// This maintains backward compatibility for any code that imports from this file
export { generatePDF } from './pdf';
export type { GeneratePDFParams } from './pdf/types';
