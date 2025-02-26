
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lead {
  name: string;
  company_name: string;
  calculator_results: any;
  calculator_inputs: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lead: Lead = await req.json();

    // Calculate ROI and savings data
    const monthlySavings = lead.calculator_results.monthlySavings || 0;
    const yearlySavings = lead.calculator_results.yearlySavings || 0;
    const savingsPercentage = lead.calculator_results.savingsPercentage || 0;

    // Generate personalized proposal content
    const proposal = {
      title: `AI Integration Proposal for ${lead.company_name}`,
      summary: `Dear ${lead.name},\n\nBased on your business requirements and our AI cost analysis, we're excited to present a customized AI integration solution for ${lead.company_name}.`,
      savings: {
        monthly: monthlySavings,
        yearly: yearlySavings,
        percentage: savingsPercentage
      },
      recommendations: [
        {
          title: "AI Customer Service Integration",
          description: "24/7 automated customer support with human-like interactions",
          benefits: [
            "Reduce response time by up to 90%",
            "Handle multiple inquiries simultaneously",
            "Maintain consistent service quality"
          ]
        },
        {
          title: "Cost Optimization",
          description: `Projected annual savings of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(yearlySavings)}`,
          benefits: [
            `${Math.round(savingsPercentage * 100)}% reduction in operational costs`,
            "Improved resource allocation",
            "Scalable solution that grows with your business"
          ]
        }
      ],
      implementation: {
        timeline: "4-6 weeks",
        phases: [
          "Initial Setup and Integration (1-2 weeks)",
          "Testing and Optimization (2-3 weeks)",
          "Training and Deployment (1 week)"
        ]
      }
    };

    return new Response(JSON.stringify(proposal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating proposal:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
