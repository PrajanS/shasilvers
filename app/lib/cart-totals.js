/**
 * Bag totals.
 *
 * Shopify returns the money; this adds the two things the design insists on
 * showing before payment — the shipping line and the GST already inside the
 * price — so the buyer never meets a number for the first time at checkout.
 */

import {FREE_SHIPPING_THRESHOLD, GST_RATE, SHIPPING_FEE} from '~/lib/shop';

/**
 * @param {any} cart
 * @returns {{
 *   currencyCode: string,
 *   subtotal: number,
 *   shipping: number,
 *   gst: number,
 *   total: number,
 *   freeShipping: boolean,
 * }|null}
 */
export function cartTotals(cart) {
  const subtotalMoney = cart?.cost?.subtotalAmount;
  if (!subtotalMoney) return null;

  const subtotal = Number(subtotalMoney.amount);
  if (!Number.isFinite(subtotal)) return null;

  const currencyCode = subtotalMoney.currencyCode ?? 'INR';
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : SHIPPING_FEE;

  // Prices are quoted GST-inclusive, so the tax line is informational: it
  // reports how much of the subtotal is already tax, and is not added on.
  const gst = subtotal - subtotal / (1 + GST_RATE);

  return {
    currencyCode,
    subtotal,
    shipping,
    gst,
    total: subtotal + shipping,
    freeShipping,
  };
}

/**
 * Total grams in the bag, from each variant's shipping weight.
 * Returns null when no line carries a weight, so the UI can omit the line
 * rather than claim `0 g`.
 * @param {any} cart
 * @returns {number|null}
 */
export function cartWeightGrams(cart) {
  const lines = cart?.lines?.nodes ?? [];
  let total = 0;
  let seen = false;

  for (const line of lines) {
    const weight = Number(line?.merchandise?.weight);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    seen = true;
    total += toGrams(weight, line?.merchandise?.weightUnit) * (line.quantity ?? 1);
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
