import {formatAmount} from '~/lib/money';
import {FREE_SHIPPING_THRESHOLD, SHOP} from '~/lib/shop';

/**
 * The rate strip.
 *
 * Replaces the old black announcement bar. It carries the two numbers a
 * silver buyer actually checks before anything else: the published market
 * rate, and ours underneath it.
 *
 * The gap between them is the whole pitch, so it is stated as a figure rather
 * than as a claim — the buyer can verify the market rate against any bullion
 * source, and every price on this site is struck at our rate.
 *
 * @param {{rate: {
 *   ratePerGram: number,
 *   market: number,
 *   saving: number,
 *   updatedAt: string,
 *   currencyCode: string,
 * }}} props
 */
export function RateStrip({rate}) {
  const perGram = (value) =>
    `${formatAmount(value, rate.currencyCode, {decimals: true})} / g`;

  return (
    <div className="rate-strip">
      <div className="rate-strip__inner">
        <p className="rate-strip__aside">
          Own manufacturing since {SHOP.since} · {SHOP.city} · Free insured
          shipping above{' '}
          {formatAmount(FREE_SHIPPING_THRESHOLD, rate.currencyCode)}
        </p>

        <dl className="rate-strip__rates">
          <div className="rate-strip__row rate-strip__row--market">
            <dt>Silver rate today</dt>
            <dd>
              {perGram(rate.market)}
              <span className="rate-strip__stamp">
                {' '}
                · updated {rate.updatedAt}
              </span>
            </dd>
          </div>

          <div className="rate-strip__row rate-strip__row--ours">
            <dt>Our rate</dt>
            <dd>
              {perGram(rate.ratePerGram)}
              {rate.saving > 0 ? (
                <span className="rate-strip__saving">
                  {' '}
                  · {formatAmount(rate.saving, rate.currencyCode, {
                    decimals: true,
                  })}{' '}
                  under market
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
