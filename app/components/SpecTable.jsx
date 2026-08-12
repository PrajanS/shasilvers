import {formatGrams} from '~/lib/money';

/**
 * The spec table.
 *
 * Purity, weight and hallmark are the three facts that decide a silver
 * purchase, so they lead. Rows with no value are dropped rather than shown
 * empty — a blank hallmark row reads as a missing hallmark.
 *
 * @param {{metrics: any, compact?: boolean, className?: string}} props
 */
export function SpecTable({metrics, compact = false, className = ''}) {
  if (!metrics) return null;

  const weight = metrics.weightGrams
    ? compact
      ? formatGrams(metrics.weightGrams)
      : `${formatGrams(metrics.weightGrams)} (± ${metrics.tolerance} g)`
    : null;

  const rows = [
    {label: 'Purity', value: metrics.purity},
    {label: compact ? 'Weight' : 'Nett weight', value: weight},
    compact ? null : {label: 'Dimensions', value: metrics.dimensions},
    compact ? null : {label: 'Finish', value: metrics.finishNote},
    {
      label: 'Hallmark',
      value: metrics.huid
        ? compact
          ? `BIS · ${metrics.huid}`
          : `BIS · HUID ${metrics.huid}`
        : null,
    },
    compact ? null : {label: 'Made at', value: metrics.madeAt},
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
