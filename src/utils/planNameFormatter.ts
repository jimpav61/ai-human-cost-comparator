
/**
 * Utility function to get a formatted display name for plan tiers
 */
export const getPlanName = (tierKey: string): string => {
  switch (tierKey) {
    case 'starter':
      return 'Starter Plan';
    case 'growth':
      return 'Growth Plan';
    case 'premium':
      return 'Premium Plan';
    default:
      return 'Custom Plan';
  }
};
