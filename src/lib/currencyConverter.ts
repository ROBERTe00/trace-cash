/**
 * Currency Converter Service
 * Provides accurate real-time exchange rates with caching
 */

interface ExchangeRates {
  rates: Record<string, number>;
  timestamp: number;
}

const CACHE_DURATION = 3600000; // 1 hour in milliseconds
const CACHE_KEY = 'exchange_rates';

/**
 * Fetch exchange rates from API
 * Uses exchangerate-api.com (free, no API key required)
 */
async function fetchExchangeRates(base: string = 'USD'): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    
    if (!response.ok) {
      console.error(`Exchange rate API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      rates: data.rates,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return null;
  }
}

/**
 * Get cached exchange rates or fetch fresh ones
 */
async function getExchangeRates(base: string = 'USD'): Promise<ExchangeRates | null> {
  // Check cache
  const cached = localStorage.getItem(`${CACHE_KEY}_${base}`);
  
  if (cached) {
    const parsed: ExchangeRates = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    if (age < CACHE_DURATION) {
      console.log(`📊 [Currency] Using cached rates (${(age / 60000).toFixed(0)} min old)`);
      return parsed;
    }
  }

  // Fetch fresh rates
  console.log('📊 [Currency] Fetching fresh exchange rates...');
  const fresh = await fetchExchangeRates(base);
  
  if (fresh) {
    localStorage.setItem(`${CACHE_KEY}_${base}`, JSON.stringify(fresh));
  }
  
  return fresh;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  // Same currency, no conversion needed
  if (from === to) {
    return amount;
  }

  try {
    const rates = await getExchangeRates(from);
    
    if (!rates) {
      console.warn(`Failed to get exchange rates for ${from}`);
      return amount; // Return original if conversion fails
    }

    const rate = rates.rates[to];
    
    if (!rate) {
      console.warn(`No exchange rate found for ${to}`);
      return amount;
    }

    const converted = amount * rate;
    console.log(`💱 [Currency] ${amount} ${from} = ${converted.toFixed(2)} ${to} (rate: ${rate})`);
    
    return converted;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return amount;
  }
}

/**
 * Get current exchange rate between two currencies
 */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const rates = await getExchangeRates(from);
  return rates?.rates[to] || 1;
}

/**
 * Clear exchange rate cache (useful for manual refresh)
 */
export function clearExchangeRateCache(): void {
  const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_KEY));
  keys.forEach(key => localStorage.removeItem(key));
  console.log('📊 [Currency] Cache cleared');
}

