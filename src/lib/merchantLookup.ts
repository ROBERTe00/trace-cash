/**
 * Merchant Lookup Service
 * Provides external merchant data for ambiguous transaction descriptions
 */

export interface MerchantInfo {
  name: string;
  category: string;
  confidence: number;
  source: string;
}

/**
 * Lookup merchant information using description
 * Falls back through multiple strategies
 */
export async function lookupMerchant(description: string): Promise<MerchantInfo | null> {
  const cleanDescription = description.toLowerCase().trim();
  
  // Strategy 1: Known merchant patterns (fast, local)
  const knownMerchant = matchKnownMerchant(cleanDescription);
  if (knownMerchant) {
    return knownMerchant;
  }
  
  // Strategy 2: Chain/franchise detection
  const chainMerchant = matchChainMerchant(cleanDescription);
  if (chainMerchant) {
    return chainMerchant;
  }
  
  // If external API lookup is needed in the future, add here
  // For now, return null for unknown merchants
  return null;
}

/**
 * Match against known merchant patterns
 */
function matchKnownMerchant(description: string): MerchantInfo | null {
  const patterns: Array<{ pattern: RegExp; category: string; name: string }> = [
    // Food & Dining
    { pattern: /esselunga|coop|conad|carrefour|iper|lidl|eurospin/i, category: "Food & Dining", name: "Supermarket" },
    { pattern: /mcdonald|burger|pizza|restaurant|trattoria|osteria/i, category: "Food & Dining", name: "Restaurant" },
    { pattern: /bar|cafe|coffee|starbucks/i, category: "Food & Dining", name: "Café" },
    
    // Transportation
    { pattern: /eni|agip|q8|shell|esso|tamoil|ip|repsol/i, category: "Transportation", name: "Gas Station" },
    { pattern: /trenitalia|italo|atm|atac|parking|autostradale/i, category: "Transportation", name: "Transport" },
    { pattern: /uber|taxi|bolt|free now/i, category: "Transportation", name: "Ride Service" },
    
    // Shopping
    { pattern: /amazon|ebay|zalando|asos|h&m|zara|ikea/i, category: "Shopping", name: "Retail" },
    { pattern: /decathlon|leroy merlin|mediaworld|unieuro/i, category: "Shopping", name: "Retail Store" },
    
    // Entertainment
    { pattern: /netflix|spotify|disney|prime video|apple music/i, category: "Entertainment", name: "Streaming Service" },
    { pattern: /cinema|teatro|concert|museum/i, category: "Entertainment", name: "Entertainment Venue" },
    { pattern: /steam|playstation|xbox|nintendo/i, category: "Entertainment", name: "Gaming" },
    
    // Healthcare
    { pattern: /farmacia|pharmacy|apotek|medical|clinic|hospital/i, category: "Healthcare", name: "Pharmacy/Medical" },
    
    // Bills & Utilities
    { pattern: /enel|acea|a2a|iren|eni gas|tim|vodafone|wind|iliad/i, category: "Bills & Utilities", name: "Utilities" },
    { pattern: /affitto|rent|condominio/i, category: "Bills & Utilities", name: "Housing" },
    
    // ATM/Banking
    { pattern: /prelievo|atm|bancomat|withdrawal/i, category: "Other", name: "ATM Withdrawal" },
    { pattern: /bonifico|transfer|pagamento/i, category: "Other", name: "Transfer" },
  ];
  
  for (const { pattern, category, name } of patterns) {
    if (pattern.test(description)) {
      return {
        name,
        category,
        confidence: 0.85,
        source: "pattern-match"
      };
    }
  }
  
  return null;
}

/**
 * Match against known chain/franchise merchants
 */
function matchChainMerchant(description: string): MerchantInfo | null {
  const chains: Record<string, { category: string; name: string }> = {
    // Major Italian supermarkets
    "esselunga": { category: "Food & Dining", name: "Esselunga" },
    "coop": { category: "Food & Dining", name: "Coop" },
    "conad": { category: "Food & Dining", name: "Conad" },
    "carrefour": { category: "Food & Dining", name: "Carrefour" },
    
    // Gas stations
    "eni": { category: "Transportation", name: "Eni" },
    "agip": { category: "Transportation", name: "Agip" },
    "shell": { category: "Transportation", name: "Shell" },
    
    // Fast food
    "mcdonald": { category: "Food & Dining", name: "McDonald's" },
    "kfc": { category: "Food & Dining", name: "KFC" },
    "burgerking": { category: "Food & Dining", name: "Burger King" },
    
    // Streaming
    "netflix": { category: "Entertainment", name: "Netflix" },
    "spotify": { category: "Entertainment", name: "Spotify" },
    "amazon": { category: "Shopping", name: "Amazon" },
  };
  
  for (const [key, info] of Object.entries(chains)) {
    if (description.includes(key)) {
      return {
        ...info,
        confidence: 0.9,
        source: "chain-match"
      };
    }
  }
  
  return null;
}

/**
 * Extract potential merchant name from transaction description
 */
export function extractMerchantName(description: string): string {
  // Remove common banking terms
  const cleaned = description
    .replace(/pagamento|payment|acquisto|purchase|pos|carta|card/gi, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove dates
    .replace(/\d+[.,]\d{2}/g, '') // Remove amounts
    .trim();
  
  // Take first significant word(s)
  const words = cleaned.split(/\s+/).filter(w => w.length > 3);
  return words.slice(0, 2).join(' ');
}
