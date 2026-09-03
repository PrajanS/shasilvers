/**
 * Pricing model.
 *
 * The price of an article is calculated, not looked up:
 *
 *     price = today's rate for its metal × its nett weight + making charge
 *
 * Everything the formula needs comes from Shopify. The metal, the weight and
 * the making charge are metafields on the product (or on the variant, where a
 * size changes the number); the rate is a shop metafield, one per metal,
 * revised each morning (see `~/lib/metal-rates.server`). No tax is added: the
 * calculated figure is the figure.
 *
 * Two consequences worth being clear about:
 *
 *   1. Shopify's own price field is not what the storefront shows. It is still
 *      what Shopify's checkout charges, so the two must be kept in step — see
 *      `shopifyPrice` and `priceMatchesShopify` on the returned metrics, which
 *      report the difference rather than hide it.
 *   2. An article missing its metal, its weight, or a published rate for its
 *      metal cannot be calculated. Rather than invent a number, those fall
 *      back to Shopify's price and render without a breakdown.
 */

import {normaliseMetal, metalLabel, rateFor} from '~/lib/metals';
import {formatAmount, formatGrams} from '~/lib/money';

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
 * The key each fact may have been defined under.
 *
 * The shop names its own metafields, and Shopify derives the key from the
 * name — "metal weight" becomes `metal_weight`. Rather than insist on one
 * spelling, each fact lists the keys it answers to, best first. The queries
 * ask for all of them, in both the default `custom` namespace and `sha`.
 */
export const METAL_KEYS = ['metal_name', 'metal'];
export const WEIGHT_KEYS = ['metal_weight', 'nett_weight_g'];
export const MAKING_KEYS = ['making_charge'];

/**
 * The first of `keys` this node actually carries a value for.
 * @param {{metafields?: Array<{key?: string, value?: string}|null>|null}} node
 * @param {string[]} keys
 * @returns {string|null}
 */
function readAny(node, keys) {
  for (const key of keys) {
    const value = getMetafield(node, key);
    if (value !== null && value !== '') return value;
  }
  return null;
}

/**
 * @param {{metafields?: Array<{key?: string, value?: string}|null>|null}} node
 * @param {string[]} keys
 * @returns {number|null}
 */
function readAnyNumber(node, keys) {
  const raw = readAny(node, keys);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Calculate a price from metal, weight and making charge.
 *
 * Returns null when the article cannot be priced this way — no weight, or no
 * published rate for its metal — so callers can fall back rather than render
 * a total struck against a missing number.
 *
 * @param {object} args
 * @param {number|null} args.ratePerGram Today's rate for this article's metal.
 * @param {number|null} [args.weightGrams] Nett weight, in grams.
 * @param {number|null} [args.makingCharge] Making charge. Absent means none.
 * @param {string|null} [args.metalName] The metal, for the caller to label with.
 * @param {string} [args.currencyCode]
 * @returns {{
 *   total: number,
 *   metal: number,
 *   making: number,
 *   weightGrams: number,
 *   ratePerGram: number,
 *   metalName: string|null,
 *   currencyCode: string,
 * }|null}
 */
export function buildPriceBreakdown({
  ratePerGram,
  weightGrams = null,
  makingCharge = null,
  metalName = null,
  currencyCode = 'INR',
}) {
  if (!(weightGrams > 0) || !(ratePerGram > 0)) return null;

  // What the metal in this article is worth at today's rate, plus what we
  // charge to have turned it into the article. Nothing else is added.
  const metal = ratePerGram * weightGrams;
  const making = makingCharge !== null && makingCharge > 0 ? makingCharge : 0;

  return {
    total: metal + making,
    metal,
    making,
    weightGrams,
    ratePerGram,
    metalName,
    currencyCode,
  };
}

/**
 * Everything the tile, the spec table and the breakdown need for one product.
 * Call this once per product.
 *
 * @param {object} args
 * @param {any} args.product Product or product-item fragment.
 * @param {any} [args.variant] Selected variant, when on a product page.
 * @param {{list?: Array<any>, currencyCode?: string}} args.rates Today's rates.
 * @returns {object}
 */
export function getProductMetrics({product, variant, rates}) {
  const shopifyPrice = variant?.price ?? product?.priceRange?.minVariantPrice;

  // Metafields may live on either the variant (per-size weight) or the product.
  const weightGrams =
    readAnyNumber(variant, WEIGHT_KEYS) ?? readAnyNumber(product, WEIGHT_KEYS);

  const makingCharge =
    readAnyNumber(variant, MAKING_KEYS) ?? readAnyNumber(product, MAKING_KEYS);

  // What the article is made of, and what that metal costs today.
  const metalName = normaliseMetal(
    readAny(variant, METAL_KEYS) ?? readAny(product, METAL_KEYS),
  );
  const rate = rateFor(rates, metalName);

  const currencyCode =
    rates?.currencyCode ?? shopifyPrice?.currencyCode ?? 'INR';

  const breakdown = buildPriceBreakdown({
    ratePerGram: rate?.ratePerGram ?? null,
    weightGrams,
    makingCharge,
    metalName,
    currencyCode,
  });

  // The calculated figure is the price the storefront quotes. Where it cannot
  // be calculated, Shopify's own price stands in.
  const price = breakdown
    ? {amount: String(breakdown.total), currencyCode}
    : shopifyPrice;

  return {
    price,
    breakdown,
    shopifyPrice,
    priceIsCalculated: Boolean(breakdown),
    priceMatchesShopify: matchesShopify(breakdown, shopifyPrice),
    metal: metalName,
    metalLabel: metalLabel(metalName),
    rate,
    weightGrams: weightGrams ?? null,
  };
}

/**
 * Per-line figures for the bag, calculated the same way as the product page
 * so the two can never quote different numbers for the same article.
 *
 * @param {any} line A cart line.
 * @param {{list?: Array<any>, currencyCode?: string}} rates
 */
export function getCartLineMetrics(line, rates) {
  const variant = line?.merchandise;
  const quantity = line?.quantity ?? 1;

  const metrics = getProductMetrics({
    product: variant?.product,
    variant,
    rates,
  });

  const unit = metrics.breakdown?.total ?? null;
  const shopifyTotal = Number(line?.cost?.totalAmount?.amount);

  return {
    ...metrics,
    quantity,
    // The line total, calculated where the article can be, and Shopify's own
    // where it cannot.
    lineTotal:
      unit !== null
        ? unit * quantity
        : Number.isFinite(shopifyTotal)
          ? shopifyTotal
          : null,
    lineTotalIsCalculated: unit !== null,
    currencyCode:
      metrics.breakdown?.currencyCode ??
      line?.cost?.totalAmount?.currencyCode ??
      rates?.currencyCode ??
      'INR',
  };
}

/**
 * The pricing basis of a line, as cart attributes carried onto the order.
 *
 * The rate moves daily, so an order priced last Tuesday cannot be reconstructed
 * from today's rate. Without this the order record has no memory of what it was
 * priced at: the confirmation email cannot show the buyer how the figure was
 * reached, and the refund policy's promise to refund "the amount you actually
 * paid, not the metal rate on the day of return" has nothing to check against.
 *
 * Deliberately customer-visible (no `_` prefix), because showing the working is
 * the shop's whole pitch — these appear at checkout, on the order in the admin,
 * and are available to the notification templates.
 *
 * Returns an empty array when the article could not be priced by the formula.
 * A line that fell back to Shopify's price has no rate to record, and inventing
 * one would put a number on the order that was never used.
 *
 * @param {ReturnType<typeof getProductMetrics>} metrics
 * @param {{now?: Date}} [options]
 * @returns {Array<{key: string, value: string}>}
 */
export function priceAttributes(metrics, options = {}) {
  const breakdown = metrics?.breakdown;
  if (!breakdown) return [];

  const {currencyCode} = breakdown;
  const on = options.now ?? new Date();

  const attributes = [
    {key: 'Metal', value: metalLabel(breakdown.metalName) ?? 'Silver'},
    {key: 'Nett weight', value: formatGrams(breakdown.weightGrams)},
    {
      key: 'Rate applied',
      value: `${formatAmount(breakdown.ratePerGram, currencyCode, {
        decimals: true,
      })}/g`,
    },
  ];

  // A making charge of zero is a fact worth recording; absent is not.
  if (breakdown.making > 0) {
    attributes.push({
      key: 'Making charge',
      value: formatAmount(breakdown.making, currencyCode),
    });
  }

  attributes.push({
    key: 'Priced on',
    value: new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(on),
  });

  return attributes;
}

/**
 * One cart line, with its pricing basis attached.
 *
 * Every add-to-cart control builds its lines through this, so quick-add, the
 * product form and the sticky buy bar cannot disagree about what gets recorded.
 *
 * @param {{variant: any, metrics: any, quantity?: number}} args
 */
export function buildCartLine({variant, metrics, quantity = 1}) {
  return {
    merchandiseId: variant.id,
    quantity,
    selectedVariant: variant,
    attributes: priceAttributes(metrics),
  };
}

/**
 * Whether the calculated price agrees with the price Shopify would charge.
 *
 * Rounded to the rupee before comparing: the two are kept in step by hand, and
 * a difference of a few paise is arithmetic, not a mistake worth reporting.
 *
 * @param {{total: number}|null} breakdown
 * @param {{amount?: string|number}|null|undefined} shopifyPrice
 * @returns {boolean|null} null when there is nothing to compare.
 */
function matchesShopify(breakdown, shopifyPrice) {
  if (!breakdown) return null;
  const theirs = Number(shopifyPrice?.amount);
  if (!Number.isFinite(theirs) || theirs <= 0) return null;
  return Math.round(theirs) === Math.round(breakdown.total);
}
