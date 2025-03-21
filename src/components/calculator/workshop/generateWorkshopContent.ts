
import { LeadData } from '../types';

export function generateWorkshopContent(
  leadData: LeadData,
  aiType: string,
  tierName: string
): Array<{ title: string; content: string; bullets?: string[] }> {
  // Extract all lead data for personalization
  const companyName = leadData.companyName || 'your company';
  const ownerFirstName = leadData.name?.split(' ')[0] || 'there';
  const industry = leadData.industry || 'your industry';
  const employeeCount = leadData.employeeCount || 10;
  
  // Extract calculator results for ROI references
  const calculatorResults = leadData.calculator_results || {};
  const monthlySavings = calculatorResults.monthlySavings || 2500;
  const yearlySavings = calculatorResults.yearlySavings || 30000;
  
  // Use more realistic savings percentage (30-45% range is realistic)
  const savingsPercentage = 35;
  const basePriceMonthly = calculatorResults.basePriceMonthly || 1500;
  
  // Create industry-specific content
  let industrySpecificChallenges = 'businesses like yours';
  let industryUseCase = 'customer service and support';
  let industryROIExample = 'increased customer satisfaction and reduced support costs';
  let industryChallengeDescription = 'handling customer inquiries efficiently while maintaining quality';
  
  // Customize content based on industry
  switch(industry.toLowerCase()) {
    case 'healthcare':
      industrySpecificChallenges = 'healthcare providers dealing with patient inquiries, appointment scheduling, and care coordination';
      industryUseCase = 'patient engagement and support services';
      industryROIExample = 'reduced wait times for patient inquiries and improved patient satisfaction scores';
      industryChallengeDescription = 'managing patient inquiries while ensuring HIPAA compliance and providing personalized care';
      break;
    case 'retail':
      industrySpecificChallenges = 'retailers managing customer inquiries, product recommendations, and order support';
      industryUseCase = 'customer support and personalized shopping assistance';
      industryROIExample = 'higher conversion rates and increased average order values through AI-assisted product recommendations';
      industryChallengeDescription = 'handling high volumes of product questions, returns, and order status inquiries efficiently';
      break;
    case 'financial services':
    case 'banking & finance':
      industrySpecificChallenges = 'financial institutions handling account inquiries, transaction support, and financial guidance';
      industryUseCase = 'customer service and financial assistance';
      industryROIExample = 'reduced call handling times for routine banking inquiries and improved compliance in customer interactions';
      industryChallengeDescription = 'providing timely financial guidance while maintaining regulatory compliance and data security';
      break;
    case 'hospitality':
      industrySpecificChallenges = 'hospitality businesses managing reservations, guest services, and travel assistance';
      industryUseCase = 'guest support and concierge services';
      industryROIExample = 'higher guest satisfaction scores and increased booking conversions through 24/7 AI availability';
      industryChallengeDescription = 'delivering personalized guest experiences while handling high volumes of reservations and inquiries';
      break;
    case 'information technology':
      industrySpecificChallenges = 'technology companies providing technical support, product guidance, and service assistance';
      industryUseCase = 'technical support and product assistance';
      industryROIExample = 'faster resolution of tier-1 support tickets and increased self-service success rates';
      industryChallengeDescription = 'scaling technical support capabilities while maintaining expertise and quality in complex problem-solving';
      break;
    case 'education':
      industrySpecificChallenges = 'educational institutions handling student inquiries, admissions questions, and academic support';
      industryUseCase = 'student services and information support';
      industryROIExample = 'increased enrollment completion rates and reduced administrative workload for common student inquiries';
      industryChallengeDescription = 'providing timely information to prospective and current students while maintaining personalized educational support';
      break;
    case 'manufacturing':
      industrySpecificChallenges = 'manufacturers managing customer inquiries, order status, and product support';
      industryUseCase = 'customer service and supply chain communications';
      industryROIExample = 'improved order accuracy and reduced time spent on routine order status inquiries';
      industryChallengeDescription = 'tracking orders, providing technical specifications, and supporting customers across complex product lines';
      break;
    case 'real estate':
      industrySpecificChallenges = 'real estate businesses handling property inquiries, viewing scheduling, and client communications';
      industryUseCase = 'client management and property information services';
      industryROIExample = 'increased property viewing conversions and more efficient lead qualification';
      industryChallengeDescription = 'responding promptly to property inquiries and efficiently scheduling viewings while maintaining personalized client relationships';
      break;
  }
  
  // Customize based on AI type
  let aiTypeDescription = 'AI chat solutions';
  let implementationSteps = [
    `Identify the specific use cases for ${companyName}'s chatbot implementation`,
    `Prepare your knowledge base with FAQs and common scenarios from your ${industry} expertise`,
    `Design conversation flows for common customer inquiries specific to ${companyName}`,
    `Train your team on how to monitor and improve the AI system for maximum ROI`
  ];
  
  if (aiType.includes('voice')) {
    aiTypeDescription = 'AI voice and chat solutions';
    implementationSteps = [
      `Identify both chat and voice interaction scenarios for ${companyName}'s customers`,
      `Prepare scripts and responses for voice interactions specific to ${industry} needs`,
      `Design conversation flows for both channels that reflect ${companyName}'s brand voice`,
      `Test voice interactions for clarity and effectiveness with sample ${industry} scenarios`,
      `Train your team on managing both chat and voice AI systems to ensure quality customer experiences`
    ];
  }
  
  // Create the workshop content sections with personalized details
  return [
    {
      title: "1. Getting Started with AI in Your Business",
      content: `Welcome to your personalized AI implementation workshop, ${ownerFirstName}. For ${companyName}, as a business in the ${industry} sector with approximately ${employeeCount} employees, you're about to discover how our ${tierName} tier ${aiTypeDescription} can transform your customer interactions.\n\nThis workshop will guide you through the essential steps to successfully implement AI in your business, focusing specifically on the challenges faced by ${industrySpecificChallenges}. Based on your calculator results, we estimate potential savings of approximately $${monthlySavings.toLocaleString()} per month or $${yearlySavings.toLocaleString()} annually by implementing our solution.`,
      bullets: [
        `Understanding the ${tierName} tier features and capabilities for ${companyName}`,
        `Identifying key opportunities for AI in your ${industry} business`,
        `Setting realistic implementation timelines and milestones`,
        `Achieving your targeted ${savingsPercentage}% cost reduction through strategic AI deployment`
      ]
    },
    {
      title: "2. Identifying Your AI Use Cases",
      content: `For ${companyName}, we recommend focusing initially on ${industryUseCase} as your primary AI implementation area. Based on our experience with similar businesses in the ${industry} sector, this approach delivers the fastest ROI while allowing your team to become comfortable with the technology.\n\nYou'll want to document your most common customer interactions and identify patterns that can be effectively handled by AI. For many ${industry} businesses like yours, implementing our solution has resulted in ${industryROIExample}, which directly contributes to the $${yearlySavings.toLocaleString()} annual savings we've projected for ${companyName}.`,
      bullets: [
        `Map ${companyName}'s customer journey to identify AI touchpoints`,
        `Document your most frequent customer inquiries and requests`,
        `Prioritize use cases based on volume and complexity`,
        `Identify opportunities for after-hours support through AI to extend ${companyName}'s service availability`
      ]
    },
    {
      title: "3. Preparing Your Team for AI Integration",
      content: `Successful AI implementation requires proper preparation of your team members, ${ownerFirstName}. For ${companyName}, we recommend a phased approach where you identify AI champions within your organization who will help drive adoption.\n\nYour staff should understand that AI will handle routine inquiries, allowing them to focus on more complex and fulfilling tasks that require human judgment and empathy. In the ${industry} sector, the key challenge is ${industryChallengeDescription}. Our ${tierName} solution at $${basePriceMonthly} per month provides the tools to overcome this challenge while delivering substantial ROI.`,
      bullets: [
        `Conduct team workshops to introduce ${companyName}'s new AI capabilities`,
        `Address concerns about job displacement with clear communication about enhanced roles`,
        `Define new roles and responsibilities in an AI-augmented workflow specific to your ${industry} processes`,
        `Establish training programs for effectively working alongside AI to maximize your projected $${monthlySavings.toLocaleString()} monthly savings`
      ]
    },
    {
      title: "4. Implementation Steps and Timeline",
      content: `Based on our experience with similar ${industry} companies with ${employeeCount} employees, we recommend implementing your ${tierName} tier solution in stages over 5-7 business days. This timeline allows for proper configuration, testing, and team training.\n\nYour implementation should begin with a pilot phase focused on a specific customer segment or service area before expanding to full deployment. For ${companyName}, we suggest starting with your highest volume inquiry types to quickly demonstrate the projected ${savingsPercentage}% cost reduction.`,
      bullets: implementationSteps
    },
    {
      title: "5. Measuring Success and Continuous Improvement",
      content: `For ${companyName}, we recommend establishing clear KPIs to measure the success of your AI implementation. These should include both operational metrics (like response times and resolution rates) and business outcomes (cost savings and customer satisfaction).\n\nOnce implemented, you should establish a regular review process to analyze AI performance and identify opportunities for improvement and expansion. This approach will help ensure you achieve and potentially exceed the projected $${yearlySavings.toLocaleString()} annual savings for ${companyName}.`,
      bullets: [
        `Set up dashboards to track key performance metrics for ${companyName}'s AI implementation`,
        `Establish a feedback loop from customers and employees to continuously refine your AI solutions`,
        `Schedule monthly review meetings to assess AI performance against your ${savingsPercentage}% savings target`,
        `Plan for quarterly expansions of AI capabilities based on results and emerging ${industry} needs`
      ]
    }
  ];
}
