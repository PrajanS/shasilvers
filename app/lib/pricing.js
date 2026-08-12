/**
 * Silver pricing model.
 *
 * A silver buyer asks three questions before clicking: what does it weigh,
 * what am I paying for the metal, and what am I paying you to make it. The
 * design answers all three on the tile and again on the product page, so the
 * breakdown has to be derivable for every product — including products whose
 * metafields have not been filled in yet.
 *
 * Two rules keep it honest:
 *   1. The total always equals the real Storefront price. We never invent a
 *      price; we only decompose the one Shopify gave us.
 *   2. The lines always sum to the total. Making charge absorbs the rounding.
 *
 * Where the shop has entered metafields (namespace `sha`) we use them. Where
 * it has not, weight is derived from the price at a 10% making assumption so
 * the layout still renders real, self-consistent numbers.
 */

import {GST_RATE} from '~/lib/shop';

/** Assumed making charge as a fraction of metal value when not specified. */
const DEFAULT_MAKING_RATIO = 0.1;

/**
 * Read a product metafield fetched via `metafields(identifiers: [...])`.
 * @param {{metafields?: Array<{key?: string, value?: string}|null>|null}} node
 * @param {string} key
 * @returns {string|null}
 */
export function getMetafield(node, key) {
  const found = node?.metafields?.find((m) => m && m.key === key);
  return found?.value ?? null;
}

/**
 * @param {{metafields?: Array<{key?: string, value?: string}|null>|null}} node
 * @param {string} key
 * @returns {number|null}
 */
function getNumericMetafield(node, key) {
  const raw = getMetafield(node, key);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Decompose a GST-inclusive price into metal, making and tax.
 *
 * @param {object} args
 * @param {{amount?: string|number, currencyCode?: string}|null|undefined} args.price
 *   The variant price from the Storefront API. Treated as GST-inclusive.
 * @param {number} args.ratePerGram Today's silver rate.
 * @param {number|null} [args.weightGrams] Nett weight, when known.
 * @param {number|null} [args.makingCharge] Making charge, when known.
 * @returns {{
 *   total: number,
 *   base: number,
 *   metal: number,
 *   making: number,
 *   gst: number,
 *   weightGrams: number,
 *   ratePerGram: number,
 *   currencyCode: string,
 *   weightIsEstimated: boolean,
 * }|null}
 */
export function buildPriceBreakdown({
  price,
  ratePerGram,
  weightGrams = null,
  makingCharge = null,
}) {
  const total = Number(price?.amount);
  if (!Number.isFinite(total) || total <= 0 || !ratePerGram) return null;

  const currencyCode = price?.currencyCode ?? 'INR';

  // Prices are quoted GST-inclusive, so strip the tax back out first.
  const base = total / (1 + GST_RATE);
  const gst = total - base;

  let metal;
  let making;
  let weightIsEstimated = false;

  if (weightGrams && weightGrams > 0) {
    // Metal value is what the weight is actually worth today. Making charge is
    // whatever is left, clamped so the lines can never contradict the total.
    metal = Math.min(weightGrams * ratePerGram, base);
    making = base - metal;
  } else {
    // No weight on file: split the base at the default making ratio and infer
    // the weight that implies. Flagged so the UI can soften the claim.
    metal = base / (1 + DEFAULT_MAKING_RATIO);
    making = base - metal;
    weightGrams = metal / ratePerGram;
    weightIsEstimated = true;
  }

  // An explicit making charge overrides the split, metal takes the remainder.
  if (makingCharge !== null && makingCharge >= 0 && makingCharge <= base) {
    making = makingCharge;
    metal = base - making;
  }

  return {
    total,
    base,
    metal,
    making,
    gst,
    weightGrams,
    ratePerGram,
    currencyCode,
    weightIsEstimated,
  };
}

/**
 * Everything the tile, the spec table and the breakdown need for one product,
 * resolved from metafields with fallbacks. Call this once per product.
 *
 * @param {object} args
 * @param {any} args.product Product or product-item fragment.
 * @param {any} [args.variant] Selected variant, when on a product page.
 * @param {number} args.ratePerGram
 * @returns {object}
 */
export function getProductMetrics({product, variant, ratePerGram}) {
  const price = variant?.price ?? product?.priceRange?.minVariantPrice;

  // Metafields may live on either the variant (per-size weight) or the product.
  const weightGrams =
    getNumericMetafield(variant, 'nett_weight_g') ??
    getNumericMetafield(product, 'nett_weight_g');

  const makingCharge =
    getNumericMetafield(variant, 'making_charge') ??
    getNumericMetafield(product, 'making_charge');

  const breakdown = buildPriceBreakdown({
    price,
    ratePerGram,
    weightGrams,
    makingCharge,
  });

  return {
    price,
    breakdown,
    weightGrams: breakdown?.weightGrams ?? null,
    weightIsEstimated: breakdown?.weightIsEstimated ?? true,
    tolerance: getNumericMetafield(product, 'weight_tolerance_g') ?? 3,
    purity: getMetafield(product, 'purity') ?? '925 sterling silver',
    huid: getMetafield(product, 'huid'),
    dimensions: getMetafield(product, 'dimensions'),
    finishNote: getMetafield(product, 'finish_note'),
    madeAt:
      getMetafield(product, 'made_at') ?? 'Sha Silvers workshop, Coimbatore',
    articleCode: getMetafield(product, 'article_code') ?? variant?.sku ?? null,
  };
}
