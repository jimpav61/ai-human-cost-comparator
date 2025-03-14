
// Main export file for report utilities
export * from './storageUtils';
export * from './pdfUtils';
export * from './validation';
export * from './types';
export * from './core/generateAndSaveReport';
export * from './core/generateAndDownloadReport';

// Export the legacy generateAndDownloadReport as a named import to avoid naming conflicts
export { generateAndDownloadReport as legacyGenerateAndDownloadReport } from './generateReport';
