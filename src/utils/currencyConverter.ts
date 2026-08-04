import { Currency, Wallet, ExchangeRateData } from '../types';

// Fallback rates relative to 1 USD
export const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1.0,
  BDT: 121.50, // 1 USD = 121.50 BDT
  EUR: 0.92,   // 1 USD = 0.92 EUR
  GBP: 0.78,   // 1 USD = 0.78 GBP
  INR: 83.50,  // 1 USD = 83.50 INR
  CAD: 1.36,   // 1 USD = 1.36 CAD
  AED: 3.67,   // 1 USD = 3.67 AED
  SAR: 3.75,   // 1 USD = 3.75 SAR
  JPY: 155.20, // 1 USD = 155.20 JPY
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AED: 'AED ',
  SAR: 'SAR ',
  JPY: '¥',
};

export const CURRENCY_NAMES: Record<string, { en: string; bn: string }> = {
  BDT: { en: 'Bangladeshi Taka', bn: 'বাংলাদেশী টাকা' },
  USD: { en: 'US Dollar', bn: 'ইউএস ডলার' },
  EUR: { en: 'Euro', bn: 'ইউরো' },
  GBP: { en: 'British Pound', bn: 'ব্রিটিশ পাউন্ড' },
  INR: { en: 'Indian Rupee', bn: 'ভারতীয় রুপি' },
  CAD: { en: 'Canadian Dollar', bn: 'কানাডিয়ান ডলার' },
  AED: { en: 'UAE Dirham', bn: 'ইউএই দিরহাম' },
  SAR: { en: 'Saudi Riyal', bn: 'সৌদি রিয়াল' },
  JPY: { en: 'Japanese Yen', bn: 'জাপানি ইয়েন' },
};

/**
 * Converts an amount from one currency to another using USD as pivot
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number> = FALLBACK_USD_RATES
): number {
  if (from === to) return amount;
  if (!amount || amount === 0) return 0;

  const fromRate = rates[from] || FALLBACK_USD_RATES[from] || 1.0;
  const toRate = rates[to] || FALLBACK_USD_RATES[to] || 1.0;

  // Convert 'from' to USD first, then USD to 'to'
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;

  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Formats amount with currency symbol and locale separators
 */
export function formatCurrency(
  amount: number,
  currency: string = 'BDT',
  lang: 'en' | 'bn' = 'en'
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const formattedNum = amount.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formattedNum}`;
}

/**
 * Calculates total combined portfolio value for a multi-currency wallet
 * in a specified base currency (e.g. BDT or USD)
 */
export function calculateTotalWalletInBaseCurrency(
  wallet: Wallet,
  targetBaseCurrency: string = 'BDT',
  rates: Record<string, number> = FALLBACK_USD_RATES
) {
  const subBalances = wallet.balances || { [wallet.currency]: wallet.balance };
  let totalInBase = 0;

  const breakdown = Object.entries(subBalances).map(([curr, amt]) => {
    const converted = convertCurrency(amt, curr, targetBaseCurrency, rates);
    totalInBase += converted;
    const rateToTarget = convertCurrency(1, curr, targetBaseCurrency, rates);

    return {
      currency: curr as Currency,
      originalBalance: amt,
      convertedInBase: converted,
      rateToTarget,
    };
  });

  return {
    totalInBase: Math.round(totalInBase * 100) / 100,
    breakdown,
  };
}

/**
 * Fetches real-time exchange rates from backend API or open public endpoint
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRateData> {
  try {
    const res = await fetch('/api/exchange-rates');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        return {
          base: data.base || 'USD',
          rates: { ...FALLBACK_USD_RATES, ...data.rates },
          lastUpdated: data.lastUpdated || new Date().toISOString(),
          isLive: data.isLive ?? true,
        };
      }
    }
  } catch (err) {
    console.warn('Backend exchange rate fetch failed, trying public open endpoint...', err);
  }

  // Fallback try open.er-api.com
  try {
    const publicRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (publicRes.ok) {
      const publicData = await publicRes.json();
      if (publicData && publicData.rates) {
        return {
          base: 'USD',
          rates: { ...FALLBACK_USD_RATES, ...publicData.rates },
          lastUpdated: new Date().toISOString(),
          isLive: true,
        };
      }
    }
  } catch (err) {
    console.warn('Public exchange rate fetch failed, using fallback static rates', err);
  }

  return {
    base: 'USD',
    rates: FALLBACK_USD_RATES,
    lastUpdated: new Date().toISOString(),
    isLive: false,
  };
}
