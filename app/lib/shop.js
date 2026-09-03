/**
 * Sha Silvers — shop constants.
 *
 * These are the fixed facts the storefront states in its chrome: the maker
 * story, the shipping threshold, the tax rate. They are deliberately in one
 * place because they appear in the rate bar, the trust row, the bag, the
 * product page and the footer, and they must never disagree between them.
 */

/**
 * Values still carrying invented data.
 *
 * A GST number and a phone number are legal and contactable facts — publishing
 * a made-up one is worse than publishing none, because a buyer cannot tell it
 * is made up. `isPlaceholder` lets the chrome omit them until they are real,
 * so nothing invented ships to a customer. Delete the entry here once the
 * genuine value is filled in above.
 */
const PLACEHOLDERS = new Set(['33ABCDE1234F1Z5', '+91 98430 00000']);

/** @param {string|null|undefined} value */
export function isPlaceholder(value) {
  return !value || PLACEHOLDERS.has(value);
}

export const SHOP = {
  name: 'Sha Silvers',
  tagline: '925 silverware · makers',
  since: 1978,
  city: 'Coimbatore',
  region: 'Tamil Nadu',
  // TODO(business): replace both with the real values, then remove them from
  // PLACEHOLDERS above so the footer starts rendering them.
  gstin: '33ABCDE1234F1Z5',
  whatsapp: '+91 98430 00000',
  whatsappHours: 'Mon–Sat, 9 AM – 7 PM',
};

/** Free insured shipping applies at and above this order value. */
export const FREE_SHIPPING_THRESHOLD = 5000;

/** Shipping charged below the threshold. */
export const SHIPPING_FEE = 180;

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
    detail: "At the day's metal rate",
  },
  {
    id: 'returns',
    title: '7-day returns',
    detail: 'Unused, original packing',
  },
];
