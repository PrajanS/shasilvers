/**
 * Money and weight formatting.
 *
 * The design specifies Indian formatting throughout: a currency symbol, a
 * space, then lakh-grouped digits with no decimals — `₹ 24,900`. We format
 * with the *actual* currency code returned by the Storefront API rather than
 * hard-coding rupees, so the storefront stays truthful when it is pointed at
 * a store that trades in another currency (mock.shop, for example, returns
 * USD). Only the symbol changes; the spacing and grouping stay as designed.
 */

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Format a Storefront API MoneyV2 (or a plain number + code) for display.
 * @param {{amount?: string|number, currencyCode?: string}|null|undefined} money
 * @param {{decimals?: boolean}} [options]
 * @returns {string}
 */
export function formatMoney(money, options = {}) {
  if (!money || money.amount === null || money.amount === undefined) return '—';
  const amount = Number(money.amount);
  if (Number.isNaN(amount)) return '—';
  return formatAmount(amount, money.currencyCode ?? 'INR', options);
}

/**
 * @param {number} amount
 * @param {string} [currencyCode]
 * @param {{decimals?: boolean}} [options]
 * @returns {string}
 */
export function formatAmount(amount, currencyCode = 'INR', options = {}) {
  // Currencies without a known symbol fall back to their ISO code, which
  // already reads as a prefix — do not add a second separator after it.
  const symbol = SYMBOLS[currencyCode] ?? currencyCode;
  // Prices in this catalogue are whole-rupee. Decimals are only shown where
  // precision is the point — the per-gram silver rate.
  const digits = options.decimals ? 2 : 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

/**
 * `218 g` — weights are always grams, always integer.
 * @param {number|null|undefined} grams
 * @returns {string}
 */
export function formatGrams(grams) {
  if (grams === null || grams === undefined || Number.isNaN(Number(grams))) {
    return '—';
  }
  return `${Math.round(Number(grams))} g`;
}
