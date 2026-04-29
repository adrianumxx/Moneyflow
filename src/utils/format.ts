/**
 * Centralized money formatting utility for Moneyflow.
 */

const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_LOCALE = 'en-US';

/**
 * Normalizes currency codes to uppercase 3-letter strings.
 * Defaults to EUR if input is invalid.
 */
export const normalizeCurrency = (currency?: string): string => {
  if (!currency || typeof currency !== 'string') return DEFAULT_CURRENCY;
  const normalized = currency.trim().toUpperCase();
  return normalized.length === 3 ? normalized : DEFAULT_CURRENCY;
};

/**
 * Returns the symbol for a given currency code.
 */
export const getCurrencySymbol = (currency?: string): string => {
  const code = normalizeCurrency(currency);
  try {
    return (0).toLocaleString(DEFAULT_LOCALE, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  } catch (e) {
    // Fallback symbols for common currencies if Intl fails
    const fallbacks: Record<string, string> = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
    };
    return fallbacks[code] || code;
  }
};

/**
 * Formats a number as a currency string.
 * Handles NaN, null, and undefined gracefully.
 */
export const formatMoney = (
  amount: number | null | undefined, 
  currency?: string, 
  locale?: string
): string => {
  const value = amount === null || amount === undefined || isNaN(amount) ? 0 : amount;
  const code = normalizeCurrency(currency);
  const activeLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LOCALE);

  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    // Fallback formatting if Intl.NumberFormat fails
    const symbol = getCurrencySymbol(code);
    return `${symbol}${value.toLocaleString(activeLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

/**
 * Simplified formatter for large numbers (e.g. 10.5k)
 */
export const formatCompactMoney = (
  amount: number | null | undefined,
  currency?: string,
  locale?: string
): string => {
  const value = amount === null || amount === undefined || isNaN(amount) ? 0 : amount;
  const code = normalizeCurrency(currency);
  const activeLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : DEFAULT_LOCALE);

  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency: code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch (e) {
    return formatMoney(value, code, activeLocale);
  }
};
