import {formatAmount, formatGrams} from '~/lib/money';

/**
 * Metal, making, tax, total.
 *
 * Unexpected cost is the single largest cause of abandonment, so the split is
 * shown wherever a price is committed to — the product page and the mobile
 * summary. The lines always sum to the price Shopify charges.
 *
 * @param {{
 *   breakdown: ReturnType<typeof import('~/lib/pricing').buildPriceBreakdown>,
 *   compact?: boolean,
 *   className?: string,
 * }} props
 */
export function PriceBreakdown({
  breakdown,
  compact = false,
  marketRate = null,
  explainMaking = false,
  className = '',
}) {
  if (!breakdown) return null;

  const {metal, making, gst, total, weightGrams, ratePerGram, currencyCode} =
    breakdown;

  // What this article's metal would have cost at the published market rate.
  // Stated as a figure so the lower rate is demonstrated, not claimed.
  const marketSaving =
    marketRate && marketRate > ratePerGram
      ? weightGrams * (marketRate - ratePerGram)
      : 0;

  const metalLabel = `Silver ${formatGrams(weightGrams)} × ${formatAmount(
    ratePerGram,
    currencyCode,
    {decimals: true},
  )}`;

  if (compact) {
    // Mobile collapses making and GST into one line — the buyer has already
    // seen the total, this is confirmation rather than justification.
    return (
      <dl className={`breakdown ${className}`}>
        <div className="breakdown__row">
          <dt>{metalLabel}</dt>
          <dd>{formatAmount(metal, currencyCode)}</dd>
        </div>
        <div className="breakdown__row">
          <dt>Making + GST</dt>
          <dd>{formatAmount(making + gst, currencyCode)}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className={`breakdown ${className}`}>
      <div className="breakdown__row">
        <dt>{metalLabel}</dt>
        <dd>{formatAmount(metal, currencyCode)}</dd>
      </div>
      <div className="breakdown__row">
        <dt>Making charge</dt>
        <dd>{formatAmount(making, currencyCode)}</dd>
      </div>
      <div className="breakdown__row">
        <dt>GST 3%</dt>
        <dd>{formatAmount(gst, currencyCode)}</dd>
      </div>
      <hr className="hairline" />
      <div className="breakdown__row breakdown__row--total">
        <dt>You pay</dt>
        <dd>{formatAmount(total, currencyCode)}</dd>
      </div>

      {marketSaving >= 1 ? (
        <div className="breakdown__row breakdown__row--saving">
          <dt>Metal charged at our rate, not market</dt>
          <dd>{formatAmount(marketSaving, currencyCode)} less</dd>
        </div>
      ) : null}

      {explainMaking ? (
        <p className="breakdown__footnote">
          Making charge is what we charge to turn the metal into the article.
          Because we manufacture rather than resell, it is ours to set.
        </p>
      ) : null}
    </dl>
  );
}
