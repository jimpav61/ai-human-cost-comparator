
export const handleReportErrors = (error: unknown): never => {
  console.error("Error in PDF report generation:", error);
  throw error;
};
