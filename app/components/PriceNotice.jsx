import {formatAmount} from '~/lib/money';

/**
 * Says so when the price quoted here is not the price Shopify will charge.
 *
 * The storefront calculates every price from today's metal rate; Shopify's own
 * price field is what its checkout actually bills. The two are kept in step by
 * hand, which means they can drift — a rate revised this morning against a
 * product price nobody updated.
 *
 * `pricing.js` and `cart-totals.js` have always worked the difference out
 * (`priceMatchesShopify`, `allCalculated`, `matchesShopify`) and nothing read
 * the answer, so a buyer could be quoted one number and charged another with no
 * signal at all. This is that signal. It renders nothing in the ordinary case
 * where the two agree — which is the case the shop should always be in.
 *
 * @param {{
 *   matches: boolean|null,
 *   quoted?: number|null,
 *   charged?: number|null,
 *   currencyCode?: string,
 *   className?: string,
 * }} props
 */
export function PriceNotice({
  matches,
  quoted = null,
  charged = null,
  currencyCode = 'INR',
  className = '',
}) {
  // null means there was nothing to compare — no calculated price, or no
  // Shopify price to compare it against. Silence is correct there.
  if (matches !== false) return null;

  const showFigures =
    Number.isFinite(quoted) && Number.isFinite(charged) && charged > 0;

  return (
    <p className={`price-notice ${className}`.trim()} role="status">
      <strong>Checkout will charge a different amount.</strong>{' '}
      {showFigures ? (
        <>
          We quote {formatAmount(quoted, currencyCode)} at today’s rate;
          checkout is set to {formatAmount(charged, currencyCode)}. The lower of
          the two is what we will honour — tell us on WhatsApp before paying and
          we will correct it.
        </>
      ) : (
        <>
          Today’s rate and the checkout price are out of step. Tell us on
          WhatsApp before paying and we will correct it.
        </>
      )}
    </p>
  );
}
