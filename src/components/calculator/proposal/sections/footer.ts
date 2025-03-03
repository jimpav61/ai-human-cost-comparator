import { JsPDFWithAutoTable } from '../types';
import { GenerateProposalParams } from '../types';

export const addFooter = (doc: JsPDFWithAutoTable, params: GenerateProposalParams, reportDate: string): void => {
  // Footer with personalization and industry/employee info if available
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  let footerText = `Proposal prepared exclusively for ${params.companyName}`;
  if (params.industry) {
    footerText += ` (${params.industry})`;
  }
  if (params.employeeCount) {
    footerText += ` with ${params.employeeCount} employees`;
  }
  doc.text(footerText, 20, 280);
  doc.text(`Generated on ${reportDate} | Valid for 30 days`, 20, 287);
};
