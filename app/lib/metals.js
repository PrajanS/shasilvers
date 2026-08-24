/**
 * Metals.
 *
 * The shop is not silver-only: an article is made of whatever metal the
 * product says it is made of, and each metal is charged at its own rate per
 * gram for the day. Both facts come from Shopify — the metal from the
 * product's `sha.metal` metafield, the rates from shop metafields (see
 * `~/lib/metal-rates.server`) — so adding a metal is an admin action, never a
 * code change.
 *
 * These helpers are pure and safe on both sides of hydration.
 */

/**
 * Normalise a metal name for lookup: `"  Silver "` and `"SILVER"` are the
 * same metal as `"silver"`, whatever the shop typed in the admin.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function normaliseMetal(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

/**
 * How a metal is written in the interface: `silver` → `Silver`,
 * `white gold` → `White gold`. The admin's own spelling is preserved where it
 * gave one, so a shop selling `panchaloha` gets `Panchaloha`, not a guess.
 *
 * @param {string|null|undefined} metal
 * @returns {string|null}
 */
export function metalLabel(metal) {
  const name = normaliseMetal(metal);
  if (!name) return null;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Today's rate for one metal, out of the table the root loader resolved.
 *
 * Returns null when the shop has not published a rate for that metal — the
 * caller then shows the price without a metal breakdown rather than pricing
 * the article against a rate nobody set.
 *
 * @param {{list?: Array<any>}|null|undefined} rates
 * @param {string|null|undefined} metal
 * @returns {any|null}
 */
export function rateFor(rates, metal) {
  const list = rates?.list ?? [];
  if (!list.length) return null;

  const name = normaliseMetal(metal);
  if (!name) return null;

  return list.find((entry) => entry.metal === name) ?? null;
}
