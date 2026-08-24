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
