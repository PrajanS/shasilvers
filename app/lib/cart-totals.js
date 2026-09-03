/**
 * Bag totals.
 *
 * Calculated from the same formula as every other price on the site — rate ×
 * weight + making, per line — rather than read off Shopify's cart cost, so the
 * bag can never quote a different figure from the product page the article was
 * added from. Lines that cannot be calculated fall back to Shopify's own line
 * total, and the shipping line is added the way the design specifies.
 */

import {FREE_SHIPPING_THRESHOLD, SHIPPING_FEE} from '~/lib/shop';
import {getCartLineMetrics} from '~/lib/pricing';

/**
 * @param {any} cart
 * @param {{list?: Array<any>, currencyCode?: string}} [rates]
 * @returns {{
 *   currencyCode: string,
 *   subtotal: number,
 *   shipping: number,
 *   total: number,
 *   freeShipping: boolean,
 *   allCalculated: boolean,
 *   shopifySubtotal: number|null,
 *   matchesShopify: boolean|null,
 * }|null}
 */
export function cartTotals(cart, rates) {
  const lines = cart?.lines?.nodes ?? [];
  const fallbackMoney = cart?.cost?.subtotalAmount;

  let subtotal = 0;
  let seen = false;
  let allCalculated = true;
  let currencyCode =
    rates?.currencyCode ?? fallbackMoney?.currencyCode ?? 'INR';

  for (const line of lines) {
    const metrics = getCartLineMetrics(line, rates);
    if (metrics.lineTotal === null) continue;
    seen = true;
    if (!metrics.lineTotalIsCalculated) allCalculated = false;
    subtotal += metrics.lineTotal;
    currencyCode = metrics.currencyCode;
  }

  if (!seen) {
    // An empty bag, or one whose lines carry no cost at all.
    const amount = Number(fallbackMoney?.amount);
    if (!Number.isFinite(amount)) return null;
    subtotal = amount;
    currencyCode = fallbackMoney?.currencyCode ?? currencyCode;
    allCalculated = false;
  }

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING_FEE;

  // What Shopify would charge for the same lines. Checkout is Shopify's, so
  // where this disagrees with the calculated subtotal the buyer is about to be
  // charged a different number from the one they were quoted — the bag says so
  // rather than letting them find out on the payment page.
  const theirs = Number(fallbackMoney?.amount);
  const shopifySubtotal = Number.isFinite(theirs) && theirs > 0 ? theirs : null;

  return {
    currencyCode,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShipping,
    allCalculated,
    shopifySubtotal,
    // Rounded to the rupee: the two are kept in step by hand and a few paise
    // of arithmetic is not a discrepancy worth alarming anyone about.
    matchesShopify:
      allCalculated && shopifySubtotal !== null
        ? Math.round(shopifySubtotal) === Math.round(subtotal)
        : null,
  };
}

/**
 * Total grams in the bag.
 *
 * Prefers the nett weight the article is priced on, so the figure beside the
 * subtotal is the same weight the subtotal was calculated from. Falls back to
 * the variant's shipping weight where no nett weight is set.
 *
 * Returns null when no line carries a weight, so the UI can omit the line
 * rather than claim `0 g`.
 *
 * @param {any} cart
 * @param {{list?: Array<any>, currencyCode?: string}} [rates]
 * @returns {number|null}
 */
export function cartWeightGrams(cart, rates) {
  const lines = cart?.lines?.nodes ?? [];
  let total = 0;
  let seen = false;

  for (const line of lines) {
    const quantity = line?.quantity ?? 1;
    const nett = getCartLineMetrics(line, rates).weightGrams;

    if (nett && nett > 0) {
      seen = true;
      total += nett * quantity;
      continue;
    }

    const shipped = Number(line?.merchandise?.weight);
    if (!Number.isFinite(shipped) || shipped <= 0) continue;
    seen = true;
    total += toGrams(shipped, line?.merchandise?.weightUnit) * quantity;
  }

  return seen ? total : null;
}

/**
 * @param {number} value
 * @param {string|null|undefined} unit
 */
function toGrams(value, unit) {
  switch (unit) {
    case 'KILOGRAMS':
      return value * 1000;
    case 'OUNCES':
      return value * 28.3495;
    case 'POUNDS':
      return value * 453.592;
    case 'GRAMS':
    default:
      return value;
  }
}
