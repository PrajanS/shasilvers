/**
 * Delivery promise.
 *
 * The date appears on every tile, on the product page and in the bag. It is
 * computed once in the root loader and passed down as a formatted string, so
 * the server and the client never disagree about "today" and hydration stays
 * clean.
 *
 * TODO(integration): a real promise depends on the destination pincode and
 * whether the article is ready-to-despatch or made-to-order. Feed those in
 * here when the logistics API is wired up.
 */

/** Working days between order and delivery for a ready-to-despatch article. */
const DEFAULT_LEAD_WORKING_DAYS = 3;

/**
 * @param {Date} [now]
 * @param {number} [leadWorkingDays]
 * @returns {{iso: string, short: string, long: string}}
 */
export function getDeliveryEstimate(
  now = new Date(),
  leadWorkingDays = DEFAULT_LEAD_WORKING_DAYS,
) {
  const date = new Date(now.getTime());
  let added = 0;
  while (added < leadWorkingDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // The workshop despatches Monday to Saturday.
    if (day !== 0) added += 1;
  }

  return {
    iso: date.toISOString().slice(0, 10),
    // "Fri, 14 Aug" — the tile format.
    short: new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date),
    // "Friday, 14 August" — the product page and checkout format.
    long: new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date),
  };
}
