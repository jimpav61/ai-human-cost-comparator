
import { useState } from "react";
import { Lead } from "@/types/leads";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editableProposal, setEditableProposal] = useState<{
    id: string | null;
    content: string | null;
    version: number;
    title: string;
    notes: string;
  } | null>(null);
  const [currentRevision, setCurrentRevision] = useState<any>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Get all proposal revisions for a lead
  const getProposalRevisions = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      
      setIsLoading(false);
      return data || [];
    } catch (error) {
      console.error("Error fetching proposal revisions:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to fetch proposal revisions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return [];
    }
  };
  
  // Get the next version number for a lead
  const getNextVersionNumber = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_next_proposal_version', { p_lead_id: leadId });
      
      if (error) throw error;
      
      return data || 1;
    } catch (error) {
      console.error("Error getting next version number:", error);
      // Fallback to client-side calculation if RPC fails
      const revisions = await getProposalRevisions(leadId);
      const maxVersion = revisions.reduce(
        (max, rev) => Math.max(max, rev.version_number), 0
      );
      return maxVersion + 1;
    }
  };
  
  // Save a proposal revision
  const saveProposalRevision = async (
    leadId: string, 
    proposalContent: string,
    title: string = "Proposal",
    notes: string = "",
    isSent: boolean = false
  ) => {
    try {
      setIsLoading(true);
      
      // Get the next version number
      const versionNumber = await getNextVersionNumber(leadId);
      
      // Get current user's ID if available
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      
      // Save the proposal revision
      const { data, error } = await supabase
        .from('proposal_revisions')
        .insert({
          lead_id: leadId,
          version_number: versionNumber,
          proposal_content: proposalContent,
          title,
          notes,
          created_by: userId || null,
          is_sent: isSent
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      setIsLoading(false);
      setCurrentRevision(data);
      
      toast({
        title: "Success",
        description: `Proposal revision v${versionNumber} saved successfully`,
        variant: "default",
      });
      
      return data;
    } catch (error) {
      console.error("Error saving proposal revision:", error);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: `Failed to save proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  // Get the latest proposal revision for a lead
  const getLatestProposalRevision = async (leadId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .select('*')
        .eq('lead_id', leadId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // If no revision found, it's not really an error
        if (error.code === 'PGRST116') {
          setIsLoading(false);
          return null;
        }
        throw error;
      }
      
      setIsLoading(false);
      setCurrentRevision(data);
      return data;
    } catch (error) {
      console.error("Error fetching latest proposal revision:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to fetch latest proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Generate a complete professional PDF proposal
  const generateProfessionalProposal = (lead: Lead) => {
    // Extract lead information
    const companyName = lead.company_name || 'Client';
    const contactName = lead.name || 'Client';
    const email = lead.email || 'client@example.com';
    const phoneNumber = lead.phone_number || 'Not provided';
    const industry = lead.industry || 'Technology';
    
    // Extract AI tier information from calculator inputs
    const aiTier = lead.calculator_inputs?.aiTier || 'growth';
    const aiType = lead.calculator_inputs?.aiType || 'both';
    
    // Get tier display name
    const tierName = aiTier === 'starter' ? 'Starter Plan' : 
                    aiTier === 'growth' ? 'Growth Plan' : 
                    aiTier === 'premium' ? 'Premium Plan' : 'Growth Plan';
    
    // Get AI type display name
    const aiTypeDisplay = aiType === 'chatbot' ? 'Text Only' : 
                         aiType === 'voice' ? 'Basic Voice' : 
                         aiType === 'conversationalVoice' ? 'Conversational Voice' : 
                         aiType === 'both' ? 'Text & Basic Voice' : 
                         aiType === 'both-premium' ? 'Text & Conversational Voice' : 'Text Only';
    
    // Calculate pricing details
    const basePrice = 
      aiTier === 'starter' ? 99 :
      aiTier === 'growth' ? 229 :
      aiTier === 'premium' ? 429 : 229;
    
    const includedMinutes = aiTier === 'starter' ? 0 : 600;
    const callVolume = typeof lead.calculator_inputs?.callVolume === 'number' 
      ? lead.calculator_inputs.callVolume 
      : 0;
    const additionalVoiceCost = aiTier !== 'starter' ? callVolume * 0.12 : 0;
    const totalPrice = basePrice + additionalVoiceCost;
    
    // Get setup fee
    const setupFee = aiTier === 'starter' ? 249 : 
                    aiTier === 'growth' ? 749 : 
                    aiTier === 'premium' ? 1149 : 749;
    
    // Format date for the proposal
    const today = new Date();
    const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    // Get ROI metrics from calculator results
    const humanCostMonthly = lead.calculator_results?.humanCostMonthly || 15000;
    const monthlySavings = lead.calculator_results?.monthlySavings || (humanCostMonthly - totalPrice);
    const yearlySavings = lead.calculator_results?.yearlySavings || (monthlySavings * 12);
    const savingsPercentage = lead.calculator_results?.savingsPercentage || 
      (humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 80);
    
    // Brand Colors
    const brandRed = "#ff432a";  // Main brand color
    
    // Generate PDF content (multipage professional proposal)
    // Changed from const to let to fix the TypeScript errors
    let pdfContent = `
%PDF-1.7
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
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 28 Tf
72 740 Td
1 1 1 rg
(AI SOLUTION PROPOSAL) Tj
0 0 0 rg
/F1 12 Tf
0 -36 Td
(Prepared exclusively for ${companyName}) Tj
/F2 18 Tf
0 -50 Td
${brandRed} rg
(EXECUTIVE SUMMARY) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(Dear ${contactName},) Tj
0 -20 Td
(Thank you for the opportunity to present our AI solution proposal for ${companyName}. At ChatSites.ai, we) Tj
0 -20 Td
(specialize in developing cutting-edge conversational AI solutions that drive operational efficiency and) Tj
0 -20 Td
(enhance customer experiences across industries.) Tj
0 -40 Td
/F2 16 Tf
${brandRed} rg
(KEY BENEFITS) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf

(\\267 Reduction in operational costs by up to ${savingsPercentage}%) Tj
0 -20 Td
(\\267 Estimated annual savings of $${Math.round(yearlySavings).toLocaleString()}) Tj
0 -20 Td
(\\267 24/7 customer service availability without additional staffing costs) Tj
0 -20 Td
(\\267 Improved response times and consistency in customer communications) Tj
0 -20 Td
(\\267 Scalable solution that grows with your business needs) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(CONTACT INFORMATION) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(${contactName}) Tj
0 -20 Td
(${companyName}) Tj
0 -20 Td
(${email}) Tj
0 -20 Td
(${phoneNumber}) Tj

BT
/F2 14 Tf
72 90 Td
${brandRed} rg
(Selected Plan: ${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
/F1 12 Tf
0 -25 Td
(Date: ${formattedDate}) Tj
ET
Q
endstream
endobj

21 0 obj
<< /Length 3500 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(RECOMMENDED SOLUTION) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(${tierName} - ${aiTypeDisplay}) Tj
0 0 0 rg
0 -30 Td
/F1 12 Tf
(Based on your specific business requirements, we recommend our ${tierName} with) Tj
0 -20 Td
(${aiTypeDisplay} capabilities as the optimal solution for ${companyName}.) Tj
0 -40 Td
/F2 16 Tf
${brandRed} rg
(Solution Features:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 Customized AI model trained on your business knowledge and processes) Tj
0 -20 Td
(\\267 Advanced natural language processing for accurate understanding of customer inquiries) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} interface for versatile customer engagement) Tj
0 -20 Td
(\\267 Integration capabilities with your existing systems and workflows) Tj
0 -20 Td
(\\267 Comprehensive analytics dashboard for performance monitoring) Tj
0 -20 Td
(\\267 Regular updates and continuous improvement of AI capabilities) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(Technical Specifications:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 ${tierName} AI Engine with ${aiTier === 'premium' ? 'advanced' : aiTier === 'growth' ? 'enhanced' : 'standard'} capabilities) Tj
0 -20 Td
(\\267 ${aiTypeDisplay} Interface ${aiTier !== 'starter' ? 'with speech recognition and synthesis' : ''}) Tj
0 -20 Td`;

    // Add voice information based on plan tier
    if (aiTier === 'starter') {
      pdfContent += `
(\\267 No voice capabilities included in this tier) Tj
0 -20 Td`;
    } else {
      pdfContent += `
(\\267 Includes ${includedMinutes} voice minutes per month as part of base plan) Tj
0 -20 Td`;
      
      if (callVolume > 0) {
        pdfContent += `
(\\267 ${callVolume} additional voice minutes at $0.12/minute) Tj
0 -20 Td
(\\267 Additional voice cost: $${additionalVoiceCost.toFixed(2)}/month) Tj
0 -20 Td`;
      } else {
        pdfContent += `
(\\267 No additional voice minutes requested) Tj
0 -20 Td`;
      }
    }

    // Continue with plan details
    pdfContent += `
(\\267 ${aiTier === 'premium' ? 'Unlimited' : '50,000+'} monthly text interactions) Tj
0 -20 Td
(\\267 Secure cloud-based deployment with 99.9% uptime guarantee) Tj
0 -20 Td
(\\267 ${aiTier === 'premium' ? 'Priority' : 'Standard'} technical support and maintenance) Tj
0 -30 Td

BT
/F2 16 Tf
72 195 Td
${brandRed} rg
(Implementation Timeline:) Tj
0 0 0 rg
0 -25 Td
/F1 12 Tf
(\\267 Discovery and Planning: 1 week) Tj
0 -20 Td
(\\267 Development and Customization: 2-3 weeks) Tj
0 -20 Td
(\\267 Testing and Quality Assurance: 1 week) Tj
0 -20 Td
(\\267 Deployment and Integration: 1 week) Tj
0 -20 Td
(\\267 Training and Knowledge Transfer: 1 week) Tj
ET
Q
endstream
endobj

22 0 obj
<< /Length 3700 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(FINANCIAL IMPACT) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(Investment Details) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Monthly Base Price:) Tj
190 0 Td
($${basePrice.toFixed(2)}/month) Tj
-190 -25 Td
(Setup and Onboarding Fee:) Tj
190 0 Td
($${setupFee.toFixed(2)} one-time) Tj
-190 -25 Td`;

    // Voice information based on tier
    if (aiTier === 'starter') {
      pdfContent += `
(Voice Capabilities:) Tj
190 0 Td
(Not included in Starter Plan) Tj
-190 -25 Td`;
    } else {
      pdfContent += `
(Included Voice Minutes:) Tj
190 0 Td
(${includedMinutes} minutes/month) Tj
-190 -25 Td`;
      
      if (callVolume > 0) {
        pdfContent += `
(Additional Voice Minutes:) Tj
190 0 Td
(${callVolume} minutes @ $0.12/minute) Tj
-190 -25 Td
(Additional Voice Cost:) Tj
190 0 Td
($${additionalVoiceCost.toFixed(2)}/month) Tj
-190 -25 Td`;
      } else {
        pdfContent += `
(Additional Voice Minutes:) Tj
190 0 Td
(None requested) Tj
-190 -25 Td`;
      }
    }

    // Total costs and savings
    pdfContent += `
(Total Monthly Investment:) Tj
190 0 Td
($${totalPrice.toFixed(2)}/month) Tj
-190 -25 Td
(Annual Investment:) Tj
190 0 Td
($${(totalPrice * 10).toFixed(2)}/year (2 months free with annual plan)) Tj
-190 -45 Td

/F2 18 Tf
${brandRed} rg
(Cost Comparison and Savings) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Current Estimated Monthly Cost:) Tj
190 0 Td
($${humanCostMonthly.toLocaleString()}/month) Tj
-190 -25 Td
(AI Solution Monthly Cost:) Tj
190 0 Td
($${totalPrice.toFixed(2)}/month) Tj
-190 -25 Td
(Monthly Savings:) Tj
190 0 Td
${brandRed} rg
($${monthlySavings.toLocaleString()}/month) Tj
0 0 0 rg
-190 -25 Td
(Annual Savings:) Tj
190 0 Td
${brandRed} rg
($${yearlySavings.toLocaleString()}/year) Tj
0 0 0 rg
-190 -25 Td
(Savings Percentage:) Tj
190 0 Td
${brandRed} rg
(${savingsPercentage}%) Tj
0 0 0 rg
-190 -45 Td

/F2 18 Tf
${brandRed} rg
(Return on Investment) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Based on the projected savings and implementation costs, your expected ROI timeline is:) Tj
0 -30 Td
(\\267 Break-even Point: ${Math.ceil(setupFee / monthlySavings)} months) Tj
0 -25 Td
(\\267 First Year ROI: ${Math.round((yearlySavings - setupFee) / setupFee * 100)}%) Tj
0 -25 Td
(\\267 Five-Year Total Savings: $${(yearlySavings * 5).toLocaleString()}) Tj
0 0 0 rg
ET
Q
endstream
endobj

23 0 obj
<< /Length 3000 >>
stream
q
${brandRed} rg
0 792 612 -70 re f
0 0 0 rg
BT
/F2 24 Tf
72 740 Td
1 1 1 rg
(IMPLEMENTATION PLAN & NEXT STEPS) Tj
0 0 0 rg
0 -45 Td
/F2 18 Tf
${brandRed} rg
(Implementation Process) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
${brandRed} rg
(1. Discovery Workshop) Tj
0 0 0 rg
0 -20 Td
(   \\267 Detailed assessment of your current processes and requirements) Tj
0 -20 Td
(   \\267 Identification of key integration points and customization needs) Tj
0 -20 Td
(   \\267 Development of implementation roadmap and timeline) Tj
0 -30 Td
${brandRed} rg
(2. Development and Customization) Tj
0 0 0 rg
0 -20 Td
(   \\267 AI model training with your business-specific data) Tj
0 -20 Td
(   \\267 User interface customization aligned with your brand) Tj
0 -20 Td
(   \\267 Integration with your existing systems and workflows) Tj
0 -30 Td
${brandRed} rg
(3. Testing and Deployment) Tj
0 0 0 rg
0 -20 Td
(   \\267 Comprehensive testing and quality assurance) Tj
0 -20 Td
(   \\267 Phased deployment to minimize business disruption) Tj
0 -20 Td
(   \\267 Performance monitoring and fine-tuning) Tj
0 -30 Td
${brandRed} rg
(4. Training and Adoption) Tj
0 0 0 rg
0 -20 Td
(   \\267 User training and knowledge transfer) Tj
0 -20 Td
(   \\267 Development of adoption strategy) Tj
0 -20 Td
(   \\267 Ongoing support and performance optimization) Tj

0 -40 Td
/F2 18 Tf
${brandRed} rg
(Next Steps) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(To proceed with implementing this AI solution for ${companyName}:) Tj
0 -30 Td
(\\267 Schedule a demonstration of our ${tierName} solution) Tj
0 -20 Td
(\\267 Finalize the proposal details and customization requirements) Tj
0 -20 Td
(\\267 Sign agreement and schedule kickoff meeting) Tj
0 0 0 rg
0 -40 Td
/F2 16 Tf
${brandRed} rg
(For questions or to move forward, please contact us at:) Tj
0 0 0 rg
0 -30 Td
/F1 13 Tf
(Email: info@chatsites.ai) Tj
0 -20 Td
(Phone: +1 480-862-0288) Tj
0 -20 Td
(Website: www.chatsites.ai) Tj
ET
Q
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
%%EOF
  `;
    
    return pdfContent;
  };
  
  // Generate the proposal and save as revision
  const handlePreviewProposal = async (lead: Lead) => {
    try {
      console.log("Previewing proposal for lead:", lead.id);
      console.log("Current lead calculator_inputs:", JSON.stringify(lead.calculator_inputs, null, 2));
      console.log("Current lead calculator_results:", JSON.stringify(lead.calculator_results, null, 2));
      setIsLoading(true);
      
      // First, check if we already have a proposal for this lead
      const existingProposal = await getLatestProposalRevision(lead.id);
      
      if (existingProposal) {
        console.log("Found existing proposal, using it:", existingProposal.id);
        setEditableProposal({
          id: lead.id,
          content: existingProposal.proposal_content,
          version: existingProposal.version_number,
          title: existingProposal.title,
          notes: existingProposal.notes || ""
        });
        setShowPdfPreview(true);
        setIsLoading(false);
        return existingProposal;
      }
      
      // Make sure we have valid calculator inputs to use
      if (!lead.calculator_inputs || !lead.calculator_results) {
        throw new Error("Lead is missing required calculator data");
      }
      
      // Generate a professional proposal
      const proposalContent = generateProfessionalProposal(lead);
      
      // Save the proposal content to the database for future editing
      const title = `Proposal for ${lead.company_name}`;
      const notes = "Generated preview";
      
      const newRevision = await saveProposalRevision(lead.id, proposalContent, title, notes);
      
      // Set the editable proposal for the editor
      setEditableProposal({
        id: lead.id,
        content: proposalContent,
        version: newRevision.version_number,
        title,
        notes
      });
      
      // Show success message
      toast({
        title: "Proposal Generated",
        description: "Your proposal has been generated successfully and can now be edited.",
        variant: "default",
      });
      
      setShowPdfPreview(true);
      setIsLoading(false);
      return newRevision;
      
    } catch (error) {
      console.error("Error previewing proposal:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to preview proposal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Update an existing proposal revision
  const updateProposalRevision = async (
    revisionId: string,
    updates: {
      proposal_content?: string;
      title?: string;
      notes?: string;
      is_sent?: boolean;
    }
  ) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('proposal_revisions')
        .update(updates)
        .eq('id', revisionId)
        .select('*')
        .single();
      
      if (error) throw error;
      
      setIsLoading(false);
      setCurrentRevision(data);
      
      toast({
        title: "Success",
        description: "Proposal revision updated successfully",
        variant: "default",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating proposal revision:", error);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: `Failed to update proposal revision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  return {
    isLoading,
    editableProposal,
    setEditableProposal,
    handlePreviewProposal,
    getProposalRevisions,
    getLatestProposalRevision,
    saveProposalRevision,
    updateProposalRevision,
    currentRevision,
    setCurrentRevision,
    showPdfPreview,
    setShowPdfPreview,
    generateProfessionalProposal
  };
};
