
import { LeadData } from '../types';

export function generateWorkshopContent(
  leadData: LeadData,
  aiType: string,
  tierName: string
): Array<{ title: string; content: string; bullets?: string[] }> {
  const companyName = leadData.companyName || 'your company';
  const industry = leadData.industry || 'your industry';
  
  // Create industry-specific content
  let industrySpecificChallenges = 'businesses like yours';
  let industryUseCase = 'customer service and support';
  
  // Customize content based on industry
  switch(industry.toLowerCase()) {
    case 'healthcare':
      industrySpecificChallenges = 'healthcare providers dealing with patient inquiries, appointment scheduling, and care coordination';
      industryUseCase = 'patient engagement and support services';
      break;
    case 'retail':
      industrySpecificChallenges = 'retailers managing customer inquiries, product recommendations, and order support';
      industryUseCase = 'customer support and personalized shopping assistance';
      break;
    case 'financial services':
    case 'banking & finance':
      industrySpecificChallenges = 'financial institutions handling account inquiries, transaction support, and financial guidance';
      industryUseCase = 'customer service and financial assistance';
      break;
    case 'hospitality':
      industrySpecificChallenges = 'hospitality businesses managing reservations, guest services, and travel assistance';
      industryUseCase = 'guest support and concierge services';
      break;
    case 'information technology':
      industrySpecificChallenges = 'technology companies providing technical support, product guidance, and service assistance';
      industryUseCase = 'technical support and product assistance';
      break;
    case 'education':
      industrySpecificChallenges = 'educational institutions handling student inquiries, admissions questions, and academic support';
      industryUseCase = 'student services and information support';
      break;
    case 'manufacturing':
      industrySpecificChallenges = 'manufacturers managing customer inquiries, order status, and product support';
      industryUseCase = 'customer service and supply chain communications';
      break;
    case 'real estate':
      industrySpecificChallenges = 'real estate businesses handling property inquiries, viewing scheduling, and client communications';
      industryUseCase = 'client management and property information services';
      break;
  }
  
  // Customize based on AI type
  let aiTypeDescription = 'AI chat solutions';
  let implementationSteps = [
    'Identify the specific use cases for your chatbot',
    'Prepare your knowledge base with FAQs and common scenarios',
    'Design conversation flows for common customer inquiries',
    'Train your team on how to monitor and improve the AI system'
  ];
  
  if (aiType.includes('voice')) {
    aiTypeDescription = 'AI voice and chat solutions';
    implementationSteps = [
      'Identify both chat and voice interaction scenarios',
      'Prepare scripts and responses for voice interactions',
      'Design conversation flows for both channels',
      'Test voice interactions for clarity and effectiveness',
      'Train your team on managing both chat and voice AI systems'
    ];
  }
  
  // Create the workshop content sections
  return [
    {
      title: "1. Getting Started with AI in Your Business",
      content: `Welcome to your personalized AI implementation workshop for ${companyName}. As a business in the ${industry} sector, you're about to discover how our ${tierName} tier ${aiTypeDescription} can transform your customer interactions.\n\nThis workshop will guide you through the essential steps to successfully implement AI in your business, focusing specifically on the challenges faced by ${industrySpecificChallenges}.`,
      bullets: [
        `Understanding the ${tierName} tier features and capabilities`,
        `Identifying key opportunities for AI in your ${industry} business`,
        `Setting realistic implementation timelines and milestones`
      ]
    },
    {
      title: "2. Identifying Your AI Use Cases",
      content: `For ${companyName}, we recommend focusing initially on ${industryUseCase} as your primary AI implementation area. Based on our experience with similar businesses in the ${industry} sector, this approach delivers the fastest ROI while allowing your team to become comfortable with the technology.\n\nYou'll want to document your most common customer interactions and identify patterns that can be effectively handled by AI.`,
      bullets: [
        "Map your customer journey to identify AI touchpoints",
        "Document your most frequent customer inquiries and requests",
        "Prioritize use cases based on volume and complexity",
        "Identify opportunities for after-hours support through AI"
      ]
    },
    {
      title: "3. Preparing Your Team for AI Integration",
      content: `Successful AI implementation requires proper preparation of your team members. For ${companyName}, we recommend a phased approach where you identify AI champions within your organization who will help drive adoption.\n\nYour staff should understand that AI will handle routine inquiries, allowing them to focus on more complex and fulfilling tasks that require human judgment and empathy.`,
      bullets: [
        "Conduct team workshops to introduce the AI capabilities",
        "Address concerns about job displacement with clear communication",
        "Define new roles and responsibilities in an AI-augmented workflow",
        "Establish training programs for effectively working alongside AI"
      ]
    },
    {
      title: "4. Implementation Steps and Timeline",
      content: `Based on our experience with similar companies in the ${industry} sector, we recommend implementing your ${tierName} tier solution in stages over 4-6 weeks. This timeline allows for proper configuration, testing, and team training.\n\nYour implementation should begin with a pilot phase focused on a specific customer segment or service area before expanding to full deployment.`,
      bullets: implementationSteps
    },
    {
      title: "5. Measuring Success and Continuous Improvement",
      content: `For ${companyName}, we recommend establishing clear KPIs to measure the success of your AI implementation. These should include both operational metrics (like response times and resolution rates) and business outcomes (cost savings and customer satisfaction).\n\nOnce implemented, you should establish a regular review process to analyze AI performance and identify opportunities for improvement and expansion.`,
      bullets: [
        "Set up dashboards to track key performance metrics",
        "Establish a feedback loop from customers and employees",
        "Schedule monthly review meetings to assess AI performance",
        "Plan for quarterly expansions of AI capabilities based on results"
      ]
    }
  ];
}
