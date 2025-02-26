
// AI pricing constants
export const AI_RATES = {
  // Voice AI rates
  voice: {
    basic: 0.06, // $ per minute
    standard: 0.12, // $ per minute
    premium: 0.25, // $ per minute
  },
  // Chatbot rates (monthly subscription + per message)
  chatbot: {
    basic: { base: 99, perMessage: 0.003 },     // $99/month + $0.003 per message
    standard: { base: 249, perMessage: 0.005 }, // $249/month + $0.005 per message
    premium: { base: 499, perMessage: 0.008 }   // $499/month + $0.008 per message
  }
};

// Human labor costs by role (North American averages in 2025)
export const HUMAN_HOURLY_RATES = {
  customerService: 21.50, // $ per hour
  sales: 28.75, // $ per hour
  technicalSupport: 32.50, // $ per hour
  generalAdmin: 19.25, // $ per hour
};

export const ROLE_LABELS = {
  customerService: "Customer Service",
  sales: "Sales",
  technicalSupport: "Technical Support",
  generalAdmin: "General Admin"
};
