
import { generateCoverPageContent } from "./pdf-sections/cover-page.ts";
import { generateSolutionPageContent } from "./pdf-sections/solution-page.ts";
import { generateFinancialPageContent } from "./pdf-sections/financial-page.ts";
import { generateNextStepsPageContent } from "./pdf-sections/next-steps-page.ts";
import { extractProposalData } from "./pdf-data-extractor.ts";
import { isValidPdf, debugLog } from "./pdf-utils.ts";

/**
 * Generates a professional PDF proposal document based on lead data
 * @param lead The lead data containing company info and calculator results
 * @returns A PDF document as a string with proper PDF structure
 */
export function generateProfessionalProposal(lead: any): string {
  console.log('=== GENERATING PROFESSIONAL PROPOSAL ===');
  console.log('Lead ID:', lead.id);
  console.log('Company name:', lead.company_name);
  
  try {
    // Extract all data needed for the PDF
    const proposalData = extractProposalData(lead);
    debugLog("Proposal Data Ready", { company: proposalData.companyName, plan: proposalData.tierName });
    
    // Create the PDF document with proper structure
    let pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog
   /Pages 2 0 R
   /Outlines 3 0 R
>>
endobj

2 0 obj
<< /Type /Pages
   /Kids [4 0 R 8 0 R 12 0 R 16 0 R]
   /Count 4
>>
endobj

3 0 obj
<< /Type /Outlines
   /Count 0
>>
endobj

4 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 20 0 R
>>
endobj

5 0 obj
<< /Type /Font
   /Subtype /Type1
   /Name /F1
   /BaseFont /Helvetica
>>
endobj

6 0 obj
<< /Type /Font
   /Subtype /Type1
   /Name /F2
   /BaseFont /Helvetica-Bold
>>
endobj

7 0 obj
<< /Type /Font
   /Subtype /Type1
   /Name /F3
   /BaseFont /Helvetica-Oblique
>>
endobj

8 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 21 0 R
>>
endobj

12 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 22 0 R
>>
endobj

16 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 612 792]
   /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R >> 
                /ExtGState << /GS1 30 0 R /GS2 31 0 R /GS3 32 0 R >> >>
   /Contents 23 0 R
>>
endobj

20 0 obj
<< /Length 3300 >>
stream
${generateCoverPageContent(proposalData)}
endstream
endobj

21 0 obj
<< /Length 3500 >>
stream
${generateSolutionPageContent(proposalData)}
endstream
endobj

22 0 obj
<< /Length 3700 >>
stream
${generateFinancialPageContent(proposalData)}
endstream
endobj

23 0 obj
<< /Length 3000 >>
stream
${generateNextStepsPageContent(proposalData)}
endstream
endobj

30 0 obj
<< /Type /ExtGState
   /CA 1.0
   /ca 1.0
>>
endobj

31 0 obj
<< /Type /ExtGState
   /CA 0.5
   /ca 0.5
>>
endobj

32 0 obj
<< /Type /ExtGState
   /CA 0.8
   /ca 0.8
>>
endobj

xref
0 33
0000000000 65535 f
0000000010 00000 n
0000000079 00000 n
0000000158 00000 n
0000000207 00000 n
0000000405 00000 n
0000000491 00000 n
0000000581 00000 n
0000000673 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000871 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000001071 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000001271 00000 n
0000004625 00000 n
0000008179 00000 n
0000011933 00000 n
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000000000 65535 f
0000014987 00000 n
0000015051 00000 n
0000015115 00000 n
trailer
<< /Size 33
   /Root 1 0 R
>>
startxref
15179
%%EOF`;

    // Verify the generated PDF
    if (!isValidPdf(pdfContent)) {
      console.error("CRITICAL ERROR: Generated content is not a valid PDF!");
      throw new Error("Failed to generate a valid PDF document");
    }
    
    console.log("==== PDF GENERATION COMPLETE ====");
    console.log("PDF content length:", pdfContent.length);
    console.log("PDF starts with:", pdfContent.substring(0, 20));
    
    return pdfContent;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
