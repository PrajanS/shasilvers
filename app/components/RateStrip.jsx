import {formatAmount} from '~/lib/money';
import {FREE_SHIPPING_THRESHOLD, SHOP} from '~/lib/shop';

/**
 * The rate strip.
 *
 * It carries the numbers a metal buyer actually checks before anything else:
 * the published market rate for each metal the shop sells, and ours underneath
 * it. The gap between them is the whole pitch, so it is stated as a figure
 * rather than as a claim — the buyer can verify the market rate against any
 * bullion source, and every price on this site is struck at our rate.
 *
 * The rates come from shop metafields in Shopify. A shop that has not
 * published any renders the strip without them rather than quoting a rate
 * nobody set.
 *
 * @param {{rates: {
 *   list: Array<{
 *     metal: string,
 *     label: string,
 *     ratePerGram: number,
 *     market: number|null,
 *     saving: number,
 *   }>,
 *   updatedAt: string|null,
 *   currencyCode: string,
 * }}} props
 */
export function RateStrip({rates}) {
  const list = rates?.list ?? [];
  const currencyCode = rates?.currencyCode ?? 'INR';

  const perGram = (value) =>
    `${formatAmount(value, currencyCode, {decimals: true})} / g`;

  return (
    <div className="rate-strip">
      <div className="rate-strip__inner">
        <p className="rate-strip__aside">
          Own manufacturing since {SHOP.since} · {SHOP.city} · Free insured
          shipping above {formatAmount(FREE_SHIPPING_THRESHOLD, currencyCode)}
        </p>

        {list.length ? (
          <dl className="rate-strip__rates">
            {list.map((rate) => (
              <MetalRate
                key={rate.metal}
                rate={rate}
                perGram={perGram}
                currencyCode={currencyCode}
                updatedAt={rates?.updatedAt}
                // One metal is the common case and gets the full two-row
                // treatment. Several share the strip, so each states our rate
                // with the market comparison folded onto the same line.
                stacked={list.length === 1}
              />
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}

/** @param {{rate: any, perGram: Function, currencyCode: string, updatedAt: string|null, stacked: boolean}} props */
function MetalRate({rate, perGram, currencyCode, updatedAt, stacked}) {
  const saving =
    rate.saving > 0
      ? `${formatAmount(rate.saving, currencyCode, {decimals: true})} under market`
      : null;

  if (!stacked) {
    return (
      <div className="rate-strip__row rate-strip__row--ours">
        <dt>{rate.label} · our rate</dt>
        <dd>
          {perGram(rate.ratePerGram)}
          {saving ? (
            <span className="rate-strip__saving"> · {saving}</span>
          ) : null}
        </dd>
      </div>
    );
  }

  return (
    <>
      {rate.market ? (
        <div className="rate-strip__row rate-strip__row--market">
          <dt>{rate.label} rate today</dt>
          <dd>
            {perGram(rate.market)}
            {updatedAt ? (
              <span className="rate-strip__stamp"> · updated {updatedAt}</span>
            ) : null}
          </dd>
        </div>
      ) : null}

      <div className="rate-strip__row rate-strip__row--ours">
        <dt>Our rate</dt>
        <dd>
          {perGram(rate.ratePerGram)}
          {saving ? (
            <span className="rate-strip__saving"> · {saving}</span>
          ) : null}
          {!rate.market && updatedAt ? (
            <span className="rate-strip__stamp"> · updated {updatedAt}</span>
          ) : null}
        </dd>
      </div>
    </>
  );
}
