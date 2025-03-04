
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lead } = await req.json() as { lead: Lead };

    // Get the plan details
    const aiTier = lead.calculatorResults.tierKey || 'growth';
    const aiType = lead.calculatorResults.aiType || 'chatbot';
    
    // Get the correct base price based on tier - these are the exact prices
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AI Integration Proposal</h1>
              <p>Prepared exclusively for ${lead.companyName}</p>
            </div>

            <div class="section">
              <h2>Dear ${lead.name},</h2>
              <p>Thank you for your interest in integrating AI solutions into your business operations. Based on our analysis, we've prepared a customized proposal that addresses your specific needs.</p>
            </div>

            <div class="section">
              <h3>Your Potential ROI</h3>
              <p>Based on our calculations, implementing our AI solution could result in:</p>
              <ul>
                <li>Monthly cost reduction of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.calculatorResults.monthlySavings)}</li>
                <li>Annual savings of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.calculatorResults.yearlySavings)}</li>
                <li>${(lead.calculatorResults.savingsPercentage * 100).toFixed(1)}% improvement in operational efficiency</li>
              </ul>
            </div>

            <div class="section">
              <h3>Recommended Solution: ${getTierDisplayName(aiTier)} with ${getAITypeDisplay(aiType)}</h3>
              <p>Monthly Price: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(basePrice)}</p>
              <p>We've analyzed your needs and recommend our ${getTierDisplayName(aiTier)} with ${getAITypeDisplay(aiType)} capabilities for optimal results.</p>
            </div>

            <div class="section">
              <h3>Next Steps</h3>
              <p>We'd love to schedule a detailed walkthrough of our solution and discuss how we can best implement it for ${lead.companyName}. Here's what we propose:</p>
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
      subject: `AI Integration Proposal for ${lead.companyName}`,
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
