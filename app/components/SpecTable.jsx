import {formatGrams} from '~/lib/money';

/**
 * The spec table.
 *
 * The metal and its weight, stated plainly — the two facts the price is
 * calculated from. Rows with no value are dropped rather than shown empty:
 * the shop enters these per product, and a blank row reads as a missing fact.
 *
 * @param {{metrics: any, compact?: boolean, className?: string}} props
 */
export function SpecTable({metrics, compact = false, className = ''}) {
  if (!metrics) return null;

  const weight = metrics.weightGrams ? formatGrams(metrics.weightGrams) : null;

  const rows = [
    {label: 'Metal', value: metrics.metalLabel},
    {label: compact ? 'Weight' : 'Metal weight', value: weight},
  ].filter((row) => row && row.value);

  if (!rows.length) return null;

  return (
    <dl className={`spec-table ${className}`}>
      {rows.map((row) => (
        <Row key={row.label} label={row.label} value={row.value} />
      ))}
    </dl>
  );
}

/** @param {{label: string, value: string}} props */
function Row({label, value}) {
  // dt and dd are rendered as siblings so the CSS grid can lay them out as
  // two real columns with a hairline between.
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
