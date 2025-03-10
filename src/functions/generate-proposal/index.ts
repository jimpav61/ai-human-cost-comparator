
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'
import autoTable from 'https://esm.sh/jspdf-autotable@3.7.1'

// Create a single PDF page from a lead record
const generateProfessionalProposal = (lead) => {
  console.log("Proposal generation request received");
  
  try {
    // Extract lead data
    const companyName = lead.company_name || '';
    const contactName = lead.name || '';
    const industry = lead.industry || '';
    const employeeCount = lead.employee_count || 0;
    
    // Extract calculator data - ensure we handle both string and object formats
    let calculatorInputs = lead.calculator_inputs || {};
    if (typeof calculatorInputs === 'string') {
      try {
        calculatorInputs = JSON.parse(calculatorInputs);
      } catch (e) {
        console.error("Error parsing calculator_inputs:", e);
        calculatorInputs = {};
      }
    }
    
    let calculatorResults = lead.calculator_results || {};
    if (typeof calculatorResults === 'string') {
      try {
        calculatorResults = JSON.parse(calculatorResults);
      } catch (e) {
        console.error("Error parsing calculator_results:", e);
        calculatorResults = {};
      }
    }
    
    // Ensure aiTier is defined, default to 'growth' if missing
    const aiTier = calculatorInputs.aiTier || 'growth';
    
    // Extract additional voice minutes with strong validation
    // This is the key fix for the voice minutes display issue
    const callVolume = (() => {
      // First try to directly access the value
      let value = calculatorInputs?.callVolume;
      
      // If it's a string, convert to number
      if (typeof value === 'string') {
        value = parseInt(value, 10) || 0;
      }
      
      // Ensure it's a number
      return typeof value === 'number' ? value : 0;
    })();
    
    console.log("Call volume extracted:", callVolume);
    
    // Now we have proper callVolume data
    const additionalVoiceMinutes = callVolume;
    
    // Base pricing constants
    const basePrices = {
      starter: 99,
      growth: 229,
      premium: 429
    };
    const basePrice = basePrices[aiTier] || 229;
    
    // Calculate voice costs
    const additionalVoiceCost = additionalVoiceMinutes > 0 ? additionalVoiceMinutes * 0.12 : 0;
    const totalMonthlyCost = basePrice + additionalVoiceCost;
    
    // Calculate setup fee
    const setupFees = {
      starter: 499,
      growth: 749,
      premium: 999
    };
    const setupFee = setupFees[aiTier] || 749;
    
    // Annual plan pricing with 2 months free
    const annualPlan = totalMonthlyCost * 10;
    
    // Create a new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20; // Increased margin to prevent text overrun
    
    // Define colors
    const brandRed = [255, 67, 42]; // RGB for #FF432A
    
    // Title section
    doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('AI SOLUTION PROPOSAL', pageWidth / 2, 26, { align: 'center' });
    
    // Subtitle section
    let y = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Prepared exclusively for ${companyName}`, margin, y);
    
    // Executive summary
    y += 25;
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('EXECUTIVE SUMMARY', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Dear ${contactName},`, margin, y);
    
    y += 10;
    const executiveSummary = `Thank you for the opportunity to present our AI solution proposal for ${companyName}. At ChatSites.ai, we specialize in developing cutting-edge conversational AI solutions that drive operational efficiency and enhance customer experiences across industries.`;
    
    // Fix text overrun by using splitTextToSize with a proper max width
    const execSummaryLines = doc.splitTextToSize(executiveSummary, pageWidth - 2 * margin);
    doc.text(execSummaryLines, margin, y);
    
    // Update y position based on text height
    y += execSummaryLines.length * 7;
    
    // Key benefits
    y += 15;
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('KEY BENEFITS', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('• Reduction in operational costs by up to 98%', margin, y);
    y += 10;
    doc.text('• 24/7 availability without additional staffing costs', margin, y);
    y += 10;
    doc.text('• Faster response times and improved customer satisfaction', margin, y);
    y += 10;
    doc.text('• Scalable to handle unlimited concurrent conversations', margin, y);
    
    // Recommended solution
    y += 25;
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('RECOMMENDED SOLUTION', margin, y);
    
    y += 20;
    // Generate a table for pricing details
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { cellWidth: 180 }
      },
      body: [
        ['Monthly Base Price:', `$${basePrice.toFixed(2)}/month`],
        ['Setup and Onboarding Fee:', `$${setupFee.toFixed(2)} one-time`],
        ['Included Voice Minutes:', '600 minutes/month'],
        ['Additional Voice Minutes:', additionalVoiceMinutes > 0 ? `${additionalVoiceMinutes} minutes/month` : 'None requested'],
        ['Total Monthly Investment:', `$${totalMonthlyCost.toFixed(2)}/month`],
        ['Annual Investment:', `$${annualPlan.toFixed(2)}/year (2 months free with annual plan)`]
      ]
    });
    
    // Get the Y position after the table
    y = doc.lastAutoTable.finalY + 20;
    
    // Cost comparison section
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('Cost Comparison and Savings', margin, y);
    
    y += 20;
    
    // Extract monthly cost, savings, etc. from calculator results
    const humanCostMonthly = calculatorResults?.humanCostMonthly || 15000;
    const monthlySavings = calculatorResults?.monthlySavings || (humanCostMonthly - totalMonthlyCost);
    const annualSavings = monthlySavings * 12;
    const savingsPercentage = humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 98;
    
    // Generate a table for cost comparison
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 12, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 180 },
        1: { cellWidth: 180 }
      },
      body: [
        ['Current Estimated Monthly Cost:', `$${humanCostMonthly.toFixed(2)}/month`],
        ['AI Solution Monthly Cost:', `$${totalMonthlyCost.toFixed(2)}/month`],
        ['Monthly Savings:', { content: `$${monthlySavings.toFixed(2)}/month`, styles: { textColor: [255, 0, 0] } }],
        ['Annual Savings:', { content: `$${annualSavings.toFixed(2)}/year`, styles: { textColor: [255, 0, 0] } }],
        ['Savings Percentage:', { content: `${savingsPercentage}%`, styles: { textColor: [255, 0, 0] } }]
      ]
    });
    
    // Get the Y position after the table
    y = doc.lastAutoTable.finalY + 20;
    
    // Implementation process
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('IMPLEMENTATION PROCESS', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Initial Consultation and Needs Assessment', margin, y);
    y += 8;
    doc.text('2. Customization and Integration Planning', margin, y);
    y += 8;
    doc.text('3. AI Training with Industry-Specific Knowledge', margin, y);
    y += 8;
    doc.text('4. Implementation and Testing Phase', margin, y);
    y += 8;
    doc.text('5. Launch and Ongoing Support', margin, y);
    
    // Next steps
    y += 25;
    doc.setFontSize(20);
    doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
    doc.text('NEXT STEPS', margin, y);
    
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const nextSteps = `To move forward with this proposal, please contact us at support@chatsites.ai or call (888) 123-4567 to schedule a consultation and demo. We look forward to partnering with ${companyName} to transform your customer experience with AI.`;
    
    // Again, fix text overrun by using splitTextToSize
    const nextStepsLines = doc.splitTextToSize(nextSteps, pageWidth - 2 * margin);
    doc.text(nextStepsLines, margin, y);
    
    return doc;
  } catch (error) {
    console.error("Error generating proposal:", error);
    throw new Error(`Proposal generation failed: ${error.message}`);
  }
}

serve(async (req) => {
  // Get the API key from environment variable
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  if (!supabaseKey || !supabaseUrl) {
    return new Response(JSON.stringify({ error: 'Service configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Parse the request body
    const { lead, preview = false } = await req.json();
    
    if (!lead || !lead.id) {
      return new Response(JSON.stringify({ error: 'Missing required lead data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Generating proposal for lead ID: ${lead.id}, preview: ${preview}`);
    
    // Generate the PDF
    const doc = generateProfessionalProposal(lead);
    
    // If this is just a preview, return the PDF directly
    if (preview) {
      const pdfOutput = doc.output('arraybuffer');
      return new Response(pdfOutput, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="proposal-${lead.id}.pdf"`
        }
      });
    }
    
    // Save PDF to Supabase Storage
    const pdfOutput = doc.output('arraybuffer');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `proposal-${lead.id}-${timestamp}.pdf`;
    const filePath = `proposals/${fileName}`;
    
    // Upload the PDF to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfOutput, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload proposal: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData?.publicUrl;
    
    // Update the lead record to mark proposal as sent
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        proposal_sent: true,
        proposal_url: publicUrl,
        proposal_date: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    if (updateError) {
      throw new Error(`Failed to update lead record: ${updateError.message}`);
    }
    
    // Try to send email with proposal
    try {
      // First check if the lead has an email
      if (!lead.email) {
        throw new Error('Lead has no email address');
      }
      
      // Create an email record in the emails table
      const { error: emailError } = await supabase
        .from('emails')
        .insert({
          to: lead.email,
          subject: `Your AI Solution Proposal for ${lead.company_name}`,
          html_body: `
            <p>Dear ${lead.name},</p>
            <p>Thank you for your interest in ChatSites.ai. We're excited to share our AI solution proposal customized for ${lead.company_name}.</p>
            <p>Please find your proposal attached or <a href="${publicUrl}">click here to view it</a>.</p>
            <p>If you have any questions or would like to schedule a demo, please don't hesitate to contact us.</p>
            <p>Best regards,<br/>The ChatSites.ai Team</p>
          `,
          attachment_urls: [publicUrl],
          metadata: {
            lead_id: lead.id,
            company_name: lead.company_name,
            proposal_url: publicUrl
          }
        });
      
      if (emailError) {
        throw new Error(`Failed to create email record: ${emailError.message}`);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue with the response even if email sending fails
    }
    
    return new Response(JSON.stringify({ 
      message: 'Proposal generated and sent successfully',
      url: publicUrl
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in proposal generation:", error);
    
    return new Response(JSON.stringify({ 
      error: `Proposal generation failed: ${error.message}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
})
