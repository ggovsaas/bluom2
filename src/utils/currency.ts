// Currency detection and formatting utilities

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to EUR
}

// Currency rates (simplified - in production, use a real API)
const CURRENCY_RATES: Record<string, CurrencyInfo> = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.08 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.85 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.48 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.65 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 161.0 },
};

// Base prices in EUR
export const BASE_PRICES = {
  TRIAL: 9.08,
  MONTHLY: 8.09,
  ANNUAL: 4.50,
};

// Detect user's currency based on their location
export function detectUserCurrency(): string {
  // Try to get currency from browser locale
  try {
    const locale = navigator.language || navigator.languages?.[0] || 'en-US';
    const region = locale.split('-')[1] || locale.split('_')[1];
    
    // Map regions to currencies
    const regionToCurrency: Record<string, string> = {
      'US': 'USD',
      'GB': 'GBP',
      'CA': 'CAD',
      'AU': 'AUD',
      'JP': 'JPY',
      'DE': 'EUR',
      'FR': 'EUR',
      'IT': 'EUR',
      'ES': 'EUR',
      'NL': 'EUR',
      'BE': 'EUR',
      'AT': 'EUR',
      'IE': 'EUR',
      'PT': 'EUR',
      'FI': 'EUR',
      'GR': 'EUR',
      'LU': 'EUR',
      'MT': 'EUR',
      'CY': 'EUR',
      'SK': 'EUR',
      'SI': 'EUR',
      'EE': 'EUR',
      'LV': 'EUR',
      'LT': 'EUR',
    };
    
    return regionToCurrency[region] || 'EUR';
  } catch (error) {
    console.warn('Could not detect user currency:', error);
    return 'EUR'; // Default to EUR
  }
}

// Get currency info
export function getCurrencyInfo(currencyCode: string): CurrencyInfo {
  return CURRENCY_RATES[currencyCode] || CURRENCY_RATES.EUR;
}

// Convert price from EUR to target currency
export function convertPrice(priceInEUR: number, targetCurrency: string): number {
  const currencyInfo = getCurrencyInfo(targetCurrency);
  return Math.round(priceInEUR * currencyInfo.rate * 100) / 100;
}

// Format price with currency symbol
export function formatPrice(price: number, currencyCode: string): string {
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  if (currencyCode === 'JPY') {
    // Japanese Yen doesn't use decimal places
    return `${currencyInfo.symbol}${Math.round(price)}`;
  }
  
  return `${currencyInfo.symbol}${price.toFixed(2)}`;
}

// Get all available currencies
export function getAvailableCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCY_RATES);
}

// Get pricing for a specific currency
export function getPricingForCurrency(currencyCode: string) {
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  return {
    trial: {
      price: convertPrice(BASE_PRICES.TRIAL, currencyCode),
      formatted: formatPrice(convertPrice(BASE_PRICES.TRIAL, currencyCode), currencyCode),
      currency: currencyInfo
    },
    monthly: {
      price: convertPrice(BASE_PRICES.MONTHLY, currencyCode),
      formatted: formatPrice(convertPrice(BASE_PRICES.MONTHLY, currencyCode), currencyCode),
      currency: currencyInfo
    },
    annual: {
      price: convertPrice(BASE_PRICES.ANNUAL, currencyCode),
      formatted: formatPrice(convertPrice(BASE_PRICES.ANNUAL, currencyCode), currencyCode),
      currency: currencyInfo
    }
  };
}
