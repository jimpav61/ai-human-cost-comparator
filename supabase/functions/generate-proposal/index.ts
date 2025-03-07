
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  name: string;
  companyName: string;
  email: string;
  website?: string;
  phoneNumber?: string;
  calculatorResults: any;
  calculator_inputs?: any;
  industry?: string;
  company_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json() as { lead: Lead };

    // Get the plan details from either calculatorResults.tierKey or calculator_inputs.aiTier
    const aiTier = lead.calculatorResults?.tierKey || 
                  (lead.calculator_inputs?.aiTier || 'growth');
    
    // Use the exact fixed prices for each tier
    let basePrice = 0;
    switch(aiTier) {
      case 'starter':
        basePrice = 99;
        break;
      case 'growth':
        basePrice = 229;
        break;
      case 'premium':
        basePrice = 429;
        break;
      default:
        basePrice = 229;
    }
    
    // Get AI type from calculator_inputs if available
    let aiType = lead.calculator_inputs?.aiType || lead.calculatorResults?.aiType || 'chatbot';
    
    // Ensure Growth plan never shows as "Text Only" - always include voice capabilities
    if (aiTier === 'growth' && (aiType === 'chatbot' || getAITypeDisplay(aiType) === 'Text Only')) {
      aiType = 'both'; // Change to "Text & Basic Voice"
    }
    
    // Premium plan should always include conversational voice
    if (aiTier === 'premium' && (aiType === 'chatbot' || aiType === 'voice' || aiType === 'both')) {
      aiType = 'both-premium'; // Change to "Text & Conversational Voice"
    }
    
    // Calculate any additional voice costs
    const includedVoiceMinutes = aiTier === 'starter' ? 0 : 600;
    
    // Extract callVolume and ensure it's a number
    const callVolume = lead.calculator_inputs?.callVolume ? 
      (typeof lead.calculator_inputs.callVolume === 'number' ? 
       lead.calculator_inputs.callVolume : 
       parseInt(String(lead.calculator_inputs.callVolume), 10)) : 0;
    
    // Additional voice minutes is exactly equal to the call volume
    const additionalVoiceMinutes = callVolume;
    
    console.log("Email proposal - callVolume:", callVolume);
    console.log("Email proposal - additionalVoiceMinutes:", additionalVoiceMinutes);
    
    // Calculate cost for additional minutes
    const additionalVoiceCost = additionalVoiceMinutes * 0.12;
    
    // Total monthly cost
    const totalMonthlyCost = basePrice + additionalVoiceCost;
    
    // Get industry if available and company name
    const industry = lead.industry || 'your industry';
    const companyName = lead.company_name || lead.companyName || 'Your Company';
    
    // Calculate monthly and yearly savings with fallbacks
    const humanCostMonthly = lead.calculatorResults?.humanCostMonthly || 15000;
    const monthlySavings = lead.calculatorResults?.monthlySavings || (humanCostMonthly - totalMonthlyCost);
    const yearlySavings = lead.calculatorResults?.yearlySavings || (monthlySavings * 12);
    const savingsPercentage = lead.calculatorResults?.savingsPercentage || 
      Math.round((monthlySavings / humanCostMonthly) * 100);
    
    // Create a professional HTML proposal
    const proposalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .highlight { color: #2563eb; }
            .footer { margin-top: 40px; text-align: center; font-size: 0.9em; }
            .cost-breakdown { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .cost-item { margin: 5px 0; }
            .voice-minutes { background-color: #f0f8ff; padding: 10px; border-left: 3px solid #4299e1; margin: 10px 0; }
            .total { font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e5e5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AI Integration Proposal</h1>
              <p>Prepared exclusively for ${companyName}</p>
            </div>

            <div class="section">
              <h2>Dear ${lead.name},</h2>
              <p>Thank you for your interest in integrating AI solutions into your business operations. Based on our analysis, we've prepared a customized proposal that addresses your specific needs in ${industry}.</p>
            </div>

            <div class="section">
              <h3>Your Potential ROI</h3>
              <p>Based on our calculations, implementing our AI solution could result in:</p>
              <ul>
                <li>Monthly cost: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalMonthlyCost)}</li>
                <li>Monthly savings of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monthlySavings)}</li>
                <li>Annual savings of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(yearlySavings)}</li>
                <li>${savingsPercentage.toFixed(1)}% improvement in operational efficiency</li>
              </ul>
            </div>

            <div class="section">
              <h3>Recommended Solution: ${getTierDisplayName(aiTier)} with ${getAITypeDisplay(aiType)}</h3>
              
              <div class="cost-breakdown">
                <div class="cost-item"><strong>Base Monthly Price:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(basePrice)}</div>
                
                ${includedVoiceMinutes > 0 ? 
                  `<div class="cost-item"><strong>Included Voice Minutes:</strong> ${includedVoiceMinutes.toLocaleString()} minutes (included with your plan)</div>` : ''}
                
                ${additionalVoiceMinutes > 0 ? 
                  `<div class="voice-minutes">
                    <strong>Additional Voice Minutes:</strong> ${additionalVoiceMinutes.toLocaleString()} minutes at $0.12/minute<br>
                    <strong>Additional Voice Cost:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(additionalVoiceCost)}
                  </div>` : ''}
                
                <div class="cost-item total"><strong>Total Monthly Cost:</strong> ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalMonthlyCost)}</div>
              </div>
              
              <p>We've analyzed your needs and recommend our ${getTierDisplayName(aiTier)} with ${getAITypeDisplay(aiType)} capabilities for optimal results.</p>
            </div>

            <div class="section">
              <h3>Next Steps</h3>
              <p>We'd love to schedule a detailed walkthrough of our solution and discuss how we can best implement it for ${companyName}. Here's what we propose:</p>
              <ol>
                <li>30-minute initial consultation</li>
                <li>Custom implementation plan presentation</li>
                <li>Technical requirements review</li>
                <li>Timeline and milestone planning</li>
              </ol>
            </div>

            <div class="footer">
              <p>Ready to get started? Reply to this email or call us to schedule your consultation.</p>
              <p>Best regards,<br>The ChatSites.ai Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the proposal via email
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'ChatSites.ai <onboarding@resend.dev>',
      to: [lead.email],
      subject: `AI Integration Proposal for ${companyName}`,
      html: proposalHtml,
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ message: "Proposal sent successfully", data: emailResponse }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

// Helper functions to get display names for tier and AI type
function getTierDisplayName(tier) {
  switch(tier) {
    case 'starter': return 'Starter Plan';
    case 'growth': return 'Growth Plan';
    case 'premium': return 'Premium Plan';
    default: return 'Custom Plan';
  }
}

function getAITypeDisplay(aiType) {
  switch(aiType) {
    case 'chatbot': return 'Text Only';
    case 'voice': return 'Basic Voice';
    case 'conversationalVoice': return 'Conversational Voice';
    case 'both': return 'Text & Basic Voice';
    case 'both-premium': return 'Text & Conversational Voice';
    default: return aiType || 'Custom AI';
  }
}
