import {formatAmount, formatGrams} from '~/lib/money';
import {metalLabel} from '~/lib/metals';

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

  const {
    metal,
    metalName,
    making,
    total,
    weightGrams,
    ratePerGram,
    currencyCode,
  } = breakdown;

  // What this article's metal would have cost at the published market rate.
  // Stated as a figure so the lower rate is demonstrated, not claimed.
  const marketSaving =
    marketRate && marketRate > ratePerGram
      ? weightGrams * (marketRate - ratePerGram)
      : 0;

  // `metal` is the money the metal is worth; `metalName` is what it is.
  const metalLine = [
    metalLabel(metalName) ?? 'Metal',
    formatGrams(weightGrams),
    `× ${formatAmount(ratePerGram, currencyCode, {decimals: true})}`,
  ].join(' ');

  if (compact) {
    // Mobile shows the two lines the price is made of and nothing else —
    // the buyer has already seen the total, this is confirmation rather
    // than justification.
    return (
      <dl className={`breakdown ${className}`}>
        <div className="breakdown__row">
          <dt>{metalLine}</dt>
          <dd>{formatAmount(metal, currencyCode)}</dd>
        </div>
        <div className="breakdown__row">
          <dt>Making charge</dt>
          <dd>{formatAmount(making, currencyCode)}</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className={`breakdown ${className}`}>
      <div className="breakdown__row">
        <dt>{metalLine}</dt>
        <dd>{formatAmount(metal, currencyCode)}</dd>
      </div>
      <div className="breakdown__row">
        <dt>Making charge</dt>
        <dd>{formatAmount(making, currencyCode)}</dd>
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
