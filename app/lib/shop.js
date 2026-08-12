/**
 * Sha Silvers — shop constants.
 *
 * These are the fixed facts the storefront states in its chrome: the maker
 * story, the shipping threshold, the tax rate. They are deliberately in one
 * place because they appear in the rate bar, the trust row, the bag, the
 * product page and the footer, and they must never disagree between them.
 */

export const SHOP = {
  name: 'Sha Silvers',
  tagline: '925 silverware · makers',
  since: 1978,
  city: 'Coimbatore',
  region: 'Tamil Nadu',
  gstin: '33ABCDE1234F1Z5',
  whatsapp: '+91 98430 00000',
  whatsappHours: 'Mon–Sat, 9 AM – 7 PM',
};

/** GST on silver articles in India. Prices on this storefront are GST-inclusive. */
export const GST_RATE = 0.03;

/** Free insured shipping applies at and above this order value. */
export const FREE_SHIPPING_THRESHOLD = 5000;

/** Shipping charged below the threshold. */
export const SHIPPING_FEE = 180;

/**
 * Silver rates, in rupees per gram.
 *
 * Two numbers, and the difference between them is the pitch. `MARKET_RATE` is
 * the published bullion rate a buyer can check anywhere; `OUR_RATE` is what
 * Sha Silvers actually charges for the metal, normally two to three rupees
 * below it, because we buy and manufacture rather than resell.
 *
 * Every price on the site is struck at OUR_RATE. The market rate is shown
 * alongside so the saving is visible rather than claimed.
 *
 * These live here rather than in `silver-rate.server.js` because the demo
 * catalogue needs them too and must stay isomorphic.
 */
export const MARKET_RATE = 94.2;
export const OUR_RATE = 91.7;

/** When the workshop revises the rate each morning. */
export const RATE_UPDATED_AT = '9:00 AM';

/**
 * The eight categories in the primary nav. `handle` is the Shopify collection
 * handle this links to; when a store does not yet have that collection the
 * listing route falls back to the full catalogue under the same title, so the
 * nav never dead-ends.
 */
export const CATEGORIES = [
  {handle: 'pooja-articles', label: 'Pooja articles', short: 'Pooja'},
  {handle: 'dining-thali', label: 'Dining & thali', short: 'Thali'},
  {handle: 'spoons-cutlery', label: 'Spoons & cutlery', short: 'Spoons'},
  {handle: 'tumblers-drinkware', label: 'Tumblers & drinkware', short: 'Tumblers'},
  {handle: 'idols', label: 'Idols', short: 'Idols'},
  {handle: 'gifting', label: 'Gifting', short: 'Gifting'},
  {handle: 'bulk-corporate', label: 'Bulk & corporate', short: 'Bulk'},
  // Jewellery is one occasional category, not the shop — it is de-emphasised.
  {handle: 'jewellery', label: 'Jewellery', short: 'Jewellery', muted: true},
];

/** @param {string} handle */
export function findCategory(handle) {
  return CATEGORIES.find((c) => c.handle === handle) ?? null;
}

/** The four reassurance points, shown on home and repeated at the product page. */
export const TRUST_POINTS = [
  {
    id: 'hallmark',
    title: 'BIS 925 hallmarked',
    detail: 'HUID on every article',
  },
  {
    id: 'shipping',
    title: 'Free insured shipping',
    detail: `Above ₹ ${FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}`,
  },
  {
    id: 'buyback',
    title: 'Lifetime buyback',
    detail: "At the day's silver rate",
  },
  {
    id: 'returns',
    title: '7-day returns',
    detail: 'Unused, original packing',
  },
];
