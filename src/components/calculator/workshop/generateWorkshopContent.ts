
import { LeadData } from '../types';

export function generateWorkshopContent(
  leadData: LeadData,
  aiType: string,
  tierName: string
): Array<{ title: string; content: string; bullets?: string[] }> {
  const companyName = leadData.companyName || 'your company';
  const contactName = leadData.name || 'business owner';
  const industry = leadData.industry || 'your industry';
  
  // Create industry-specific content
  let industrySpecificChallenges = 'businesses like yours';
  let industryUseCase = 'customer service and support';
  let industryROI = 'improved customer satisfaction and reduced operational costs';
  
  // Customize content based on industry
  switch(industry.toLowerCase()) {
    case 'healthcare':
      industrySpecificChallenges = 'healthcare providers dealing with patient inquiries, appointment scheduling, and care coordination';
      industryUseCase = 'patient engagement and support services';
      industryROI = 'a 35% reduction in call center costs and 42% faster patient query resolution';
      break;
    case 'retail':
      industrySpecificChallenges = 'retailers managing customer inquiries, product recommendations, and order support';
      industryUseCase = 'customer support and personalized shopping assistance';
      industryROI = 'a 40% decrease in support costs and 28% increase in customer satisfaction scores';
      break;
    case 'financial services':
    case 'banking & finance':
      industrySpecificChallenges = 'financial institutions handling account inquiries, transaction support, and financial guidance';
      industryUseCase = 'customer service and financial assistance';
      industryROI = 'a 32% reduction in support costs and 45% faster query resolution times';
      break;
    case 'hospitality':
      industrySpecificChallenges = 'hospitality businesses managing reservations, guest services, and travel assistance';
      industryUseCase = 'guest support and concierge services';
      industryROI = 'a 38% decrease in guest service costs and 30% improvement in guest satisfaction';
      break;
    case 'information technology':
      industrySpecificChallenges = 'technology companies providing technical support, product guidance, and service assistance';
      industryUseCase = 'technical support and product assistance';
      industryROI = 'a 45% reduction in support ticket handling time and 30% lower support costs';
      break;
    case 'education':
      industrySpecificChallenges = 'educational institutions handling student inquiries, admissions questions, and academic support';
      industryUseCase = 'student services and information support';
      industryROI = 'a 36% decrease in administrative costs and 40% faster response times';
      break;
    case 'manufacturing':
      industrySpecificChallenges = 'manufacturers managing customer inquiries, order status, and product support';
      industryUseCase = 'customer service and supply chain communications';
      industryROI = 'a 33% reduction in customer service costs and 25% improved order accuracy';
      break;
    case 'real estate':
      industrySpecificChallenges = 'real estate businesses handling property inquiries, viewing scheduling, and client communications';
      industryUseCase = 'client management and property information services';
      industryROI = 'a 42% reduction in administrative costs and 35% faster client response times';
      break;
    default:
      industryROI = 'an average 30-40% reduction in customer service costs and significantly improved response times';
  }
  
  // Customize based on AI type
  let aiTypeDescription = 'AI chat solutions';
  
  if (aiType.includes('voice')) {
    aiTypeDescription = 'AI chat solutions';
  }
  
  // Create the workshop content sections
  return [
    {
      title: "1. Getting Started with ChatSites.ai for Your Business",
      content: `Welcome to your personalized AI implementation workshop for ${companyName}, ${contactName}. As a business in the ${industry} sector, you're about to discover how ChatSites.ai's ${tierName} can transform your customer interactions.\n\nThis workshop will guide you through the essential steps to successfully implement AI in your business, focusing specifically on the challenges faced by ${industrySpecificChallenges}.`,
      bullets: [
        `Understanding ChatSites.ai's ${tierName} features and capabilities`,
        `Identifying key opportunities for AI in your ${industry} business`,
        `Setting realistic implementation timelines and milestones`
      ]
    },
    {
      title: "2. Identifying Your AI Use Cases",
      content: `For ${companyName}, ${contactName}, we recommend focusing initially on ${industryUseCase} as your primary AI implementation area. Based on our experience with similar businesses in the ${industry} sector, this approach delivers the fastest ROI while allowing your team to become comfortable with the technology.\n\nMany of our ${industry} clients have experienced ${industryROI} within the first 90 days. We'll help you document your most common customer interactions and identify patterns that can be effectively handled by ChatSites.ai.`,
      bullets: [
        "Map your customer journey to identify AI touchpoints",
        "Document your most frequent customer inquiries and requests",
        "Prioritize use cases based on volume and complexity",
        "Identify opportunities for after-hours support through AI"
      ]
    },
    {
      title: "3. Preparing Your Team for AI Integration",
      content: `Successful AI implementation requires proper preparation of your team members. For ${companyName}, ${contactName}, we recommend a phased approach where you identify AI champions within your organization who will help drive adoption.\n\nYour staff should understand that AI will handle routine inquiries, allowing them to focus on more complex and fulfilling tasks that require human judgment and empathy. ChatSites.ai's intuitive interface makes this transition smooth for your team.`,
      bullets: [
        "Conduct team workshops to introduce the AI capabilities",
        "Address concerns about job displacement with clear communication",
        "Define new roles and responsibilities in an AI-augmented workflow",
        "Establish training programs for effectively working alongside AI"
      ]
    },
    {
      title: "4. Implementation Steps and Timeline",
      content: `Based on our experience with similar companies in the ${industry} sector, ChatSites.ai can implement your ${tierName} solution in stages over 1-7 business days. This timeline allows for proper configuration, testing, and team training.\n\n${contactName}, your implementation should begin with a pilot phase focused on a specific customer segment or service area before expanding to full deployment. ChatSites.ai's team will guide you through each step.`,
      bullets: [
        "Day 1-2: Initial setup and configuration",
        "Day 3-4: Knowledge base population and AI training",
        "Day 5: Testing and refinement",
        "Day 6-7: Team training and go-live preparation"
      ]
    },
    {
      title: "5. Measuring Success and Continuous Improvement",
      content: `For ${companyName}, ${contactName}, we recommend establishing clear KPIs to measure the success of your AI implementation. These should include both operational metrics (like response times and resolution rates) and business outcomes (cost savings and customer satisfaction).\n\nOnce implemented, you should establish a regular review process with your ChatSites.ai account manager to analyze AI performance and identify opportunities for improvement and expansion. Many of our clients in the ${industry} sector see ROI within the first month.`,
      bullets: [
        "Set up ChatSites.ai's analytics dashboard to track key performance metrics",
        "Establish a feedback loop from customers and employees",
        "Schedule bi-weekly review meetings with your ChatSites.ai representative",
        "Plan for monthly expansions of AI capabilities based on results"
      ]
    }
  ];
}
