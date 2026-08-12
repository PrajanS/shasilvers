/**
 * Demo mode detection.
 *
 * True only when no real Shopify storefront is configured — i.e. Hydrogen
 * would otherwise be talking to the public mock.shop sandbox. Set
 * `PUBLIC_STORE_DOMAIN` in `.env` and every branch guarded by this flag
 * switches to the Storefront API.
 *
 * @param {{PUBLIC_STORE_DOMAIN?: string}} env
 */
export function isDemoMode(env) {
  const domain = env?.PUBLIC_STORE_DOMAIN;
  return !domain || domain.includes('mock.shop');
}
