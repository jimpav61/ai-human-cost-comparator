
import { Lead } from "@/types/leads";

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Ensure a lead has a valid UUID, replacing temp IDs with real UUIDs
 */
export function ensureLeadHasValidId(lead: Lead): Lead {
  // If the lead ID is not a valid UUID, generate a new one
  if (!isValidUUID(lead.id)) {
    console.log(`Lead has invalid UUID format: ${lead.id}, generating new UUID`);
    return {
      ...lead,
      id: crypto.randomUUID()
    };
  }
  return lead;
}

/**
 * Create a safe filename from the lead company name
 */
export function getSafeFileName(lead: Lead): string {
  return lead.company_name ? lead.company_name.replace(/[^\w\s-]/gi, '') : 'Client';
}
