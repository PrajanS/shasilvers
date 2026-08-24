/**
 * Today's metal rates, published by the shop in Shopify.
 *
 * Two numbers per metal. `market` is the bullion rate the buyer can check
 * anywhere; `ratePerGram` is what Sha Silvers actually charges for the metal,
 * and it is the rate every price on the site is struck at. Showing both is
 * the pitch: the saving is demonstrated rather than claimed.
 *
 * The rates live in shop metafields so the workshop can revise them each
 * morning from the Shopify admin without a deploy. Set them under
 * Settings → Custom data → Shop, in either the default `custom` namespace or
 * `sha` — both are read:
 *
 *   metal_rates      (json)          {"silver": {"our": 91.70, "market": 94.20},
 *                                     "gold":   {"our": 7250, "market": 7310}}
 *   rate_silver      (decimal)       91.70      — simpler alternative to the
 *   rate_gold        (decimal)       7250.00      json field, one key per metal
 *   market_silver    (decimal)       94.20      — optional published rate
 *   market_gold      (decimal)       7310.00
 *   rate_updated_at  (single line)   "9:00 AM"
 *   rate_currency    (single line)   "INR"
 *
 * The json field is the one that scales: any metal the shop starts selling
 * appears simply by adding a key, with nothing to change here. A metal with
 * no published rate is priced without a metal breakdown rather than against
 * a number nobody set.
 */

import {normaliseMetal, metalLabel} from '~/lib/metals';

/**
 * Shop-level metafields carrying the rate table.
 *
 * `metafields(identifiers:)` needs every key named up front, so the per-metal
 * keys below are a convenience for the two metals a silverware shop is most
 * likely to price. Everything else goes in `metal_rates`.
 */
export const SHOP_METAL_RATES_QUERY = `#graphql
  query ShopMetalRates($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      metafields(identifiers: [
        {namespace: "custom", key: "metal_rates"},
        {namespace: "custom", key: "rate_silver"},
        {namespace: "custom", key: "rate_gold"},
        {namespace: "custom", key: "market_silver"},
        {namespace: "custom", key: "market_gold"},
        {namespace: "custom", key: "rate_updated_at"},
        {namespace: "custom", key: "rate_currency"},
        {namespace: "sha", key: "metal_rates"},
        {namespace: "sha", key: "rate_silver"},
        {namespace: "sha", key: "rate_gold"},
        {namespace: "sha", key: "market_silver"},
        {namespace: "sha", key: "market_gold"},
        {namespace: "sha", key: "rate_updated_at"},
        {namespace: "sha", key: "rate_currency"}
      ]) {
        key
        value
      }
    }
  }
`;

/** @param {Array<{key?: string, value?: string}|null>|null|undefined} metafields */
function reader(metafields) {
  /** @param {string} key */
  return function read(key) {
    const found = (metafields ?? []).find((m) => m && m.key === key);
    const value = found?.value;
    return typeof value === 'string' && value !== '' ? value : null;
  };
}

/** @param {unknown} value */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * One metal's entry, from either shape the shop may have used:
 * a bare number (`91.70`) or an object (`{our: 91.70, market: 94.20}`).
 *
 * @param {string} metal
 * @param {unknown} value
 * @param {number|null} marketOverride
 */
function toEntry(metal, value, marketOverride = null) {
  const isObject = value && typeof value === 'object';
  const ratePerGram = toNumber(
    isObject ? (value.our ?? value.rate ?? value.ours) : value,
  );
  if (!ratePerGram) return null;

  const market =
    marketOverride ?? (isObject ? toNumber(value.market) : null) ?? null;

  return {
    metal,
    label: metalLabel(metal),
    ratePerGram,
    market,
    // Only a market rate above ours is a saving; a stale feed must never
    // render a negative one.
    saving: market && market > ratePerGram ? market - ratePerGram : 0,
  };
}

/**
 * Parse the shop's metafields into the rate table the app passes around.
 *
 * Exported for its own sake: it is pure, and the parsing rules — which shapes
 * are accepted, which are ignored — are worth being able to exercise directly.
 *
 * @param {Array<{key?: string, value?: string}|null>|null|undefined} metafields
 */
export function parseMetalRates(metafields) {
  const read = reader(metafields);
  const currencyCode = read('rate_currency') ?? 'INR';
  const updatedAt = read('rate_updated_at');

  /** @type {Map<string, any>} */
  const entries = new Map();

  // The json table first, so an explicit per-metal key can override it below.
  const raw = read('metal_rates');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(parsed)) {
          const metal = normaliseMetal(key);
          if (!metal) continue;
          const entry = toEntry(metal, value);
          if (entry) entries.set(metal, entry);
        }
      }
    } catch {
      // A malformed json field must not take the storefront down; the
      // per-metal keys below still apply, and a shop with neither simply
      // renders no rates.
    }
  }

  for (const metal of ['silver', 'gold']) {
    const entry = toEntry(
      metal,
      read(`rate_${metal}`),
      toNumber(read(`market_${metal}`)),
    );
    if (entry) entries.set(metal, entry);
  }

  return {
    list: [...entries.values()],
    updatedAt,
    currencyCode,
  };
}

/**
 * Resolve the rate table for a request.
 *
 * Cached for ten minutes: the workshop revises the rates once each morning,
 * so this must not become a per-request round trip, and a rate change must
 * still reach the storefront the same morning it is made.
 *
 * A storefront that cannot answer returns an empty table rather than throwing
 * — the site keeps selling at Shopify's prices, without the breakdown.
 *
 * @param {any} storefront
 */
export async function getMetalRates(storefront) {
  const data = await storefront
    .query(SHOP_METAL_RATES_QUERY, {
      cache: storefront.CacheCustom({
        mode: 'public',
        maxAge: 600,
        staleWhileRevalidate: 3600,
      }),
    })
    .catch(() => null);

  return parseMetalRates(data?.shop?.metafields);
}
