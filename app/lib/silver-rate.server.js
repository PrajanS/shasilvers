/**
 * Today's silver rates.
 *
 * Two numbers. `market` is the published bullion rate the buyer can check
 * anywhere; `ratePerGram` is Sha Silvers' own rate, normally two to three
 * rupees below it, and it is the one every price on the site is struck at.
 *
 * Showing both is the pitch: the saving is demonstrated rather than claimed,
 * and the buyer can verify it against any bullion source.
 *
 * Loaded once in the root loader and passed down, so the whole page agrees on
 * one pair of figures and the server and client render identically.
 *
 * TODO(integration): replace the constants in `~/lib/shop` with the real feed
 * — the workshop revises the rate daily at 9:00 AM IST. Any source returning
 * `{market, ratePerGram, updatedAt}` will drop in without touching callers.
 * Cache it; do not fetch per request.
 */

import {MARKET_RATE, OUR_RATE, RATE_UPDATED_AT} from '~/lib/shop';

/**
 * @returns {{
 *   ratePerGram: number,
 *   market: number,
 *   saving: number,
 *   updatedAt: string,
 *   currencyCode: string,
 * }}
 */
export function getSilverRate() {
  return {
    // Our rate. Everything is priced from this.
    ratePerGram: OUR_RATE,
    market: MARKET_RATE,
    saving: Math.max(0, MARKET_RATE - OUR_RATE),
    updatedAt: RATE_UPDATED_AT,
    currencyCode: 'INR',
  };
}
