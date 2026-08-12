/**
 * Listing filters and sort — all of it URL state.
 *
 * Applied filters render as removable chips, and every chip, the sort control
 * and the pagination cursor live in the query string. That makes a filtered
 * listing linkable, shareable and survivable across a reload, which is the
 * whole point of putting the filters above the fold in the first place.
 */

export const FILTER_GROUPS = [
  {
    param: 'price',
    label: 'Price',
    options: [
      {value: 'under-10000', label: 'Under ₹ 10,000', min: 0, max: 10000},
      {value: '10000-25000', label: '₹ 10,000 – 25,000', min: 10000, max: 25000},
      {value: '25000-50000', label: '₹ 25,000 – 50,000', min: 25000, max: 50000},
      {value: 'above-50000', label: 'Above ₹ 50,000', min: 50000, max: Infinity},
    ],
  },
  {
    param: 'weight',
    label: 'Weight',
    options: [
      {value: 'under-100', label: 'Under 100 g', min: 0, max: 100},
      {value: '100-250', label: '100 – 250 g', min: 100, max: 250},
      {value: 'above-250', label: 'Above 250 g', min: 250, max: Infinity},
    ],
  },
  {
    param: 'type',
    label: 'Article type',
    options: [
      {value: 'thali-plates', label: 'Thali & plates'},
      {value: 'kumkum-bharani', label: 'Kumkum & bharani'},
      {value: 'diya-lamps', label: 'Diya & lamps'},
      {value: 'bells-accessories', label: 'Bells & accessories'},
    ],
  },
  {
    param: 'avail',
    label: 'Availability',
    options: [
      {value: 'ready', label: 'Ready to despatch'},
      {value: 'made-to-order', label: 'Made to order'},
    ],
  },
];

export const SORT_OPTIONS = [
  {value: 'price-asc', label: 'Price, low to high', sortKey: 'PRICE', reverse: false},
  {value: 'price-desc', label: 'Price, high to low', sortKey: 'PRICE', reverse: true},
  {value: 'newest', label: 'Newest first', sortKey: 'CREATED', reverse: true},
  {value: 'popular', label: 'Most popular', sortKey: 'BEST_SELLING', reverse: false},
];

export const DEFAULT_SORT = 'price-asc';

/** @param {string} value */
export function getSort(value) {
  return SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];
}

/**
 * Read every filter group out of the query string.
 * @param {URLSearchParams} searchParams
 * @returns {Record<string, string[]>}
 */
export function parseFilters(searchParams) {
  /** @type {Record<string, string[]>} */
  const filters = {};
  for (const group of FILTER_GROUPS) {
    const values = searchParams.getAll(group.param).filter(Boolean);
    if (values.length) filters[group.param] = values;
  }
  return filters;
}

/**
 * The removable chips shown above the grid, in group order.
 * @param {Record<string, string[]>} filters
 * @returns {Array<{param: string, value: string, label: string}>}
 */
export function getActiveChips(filters) {
  const chips = [];
  for (const group of FILTER_GROUPS) {
    for (const value of filters[group.param] ?? []) {
      const option = group.options.find((o) => o.value === value);
      if (option) chips.push({param: group.param, value, label: option.label});
    }
  }
  return chips;
}

/**
 * Toggle one filter value, returning the new query string.
 *
 * Pagination cursors are dropped whenever the filter set changes — keeping a
 * cursor from the previous result set would page into the wrong place.
 *
 * @param {URLSearchParams} searchParams
 * @param {string} param
 * @param {string} value
 * @returns {string}
 */
export function toggleFilterSearch(searchParams, param, value) {
  const next = new URLSearchParams(searchParams);
  const current = next.getAll(param);
  next.delete(param);
  for (const existing of current) {
    if (existing !== value) next.append(param, existing);
  }
  if (!current.includes(value)) next.append(param, value);
  next.delete('cursor');
  next.delete('direction');
  return next.toString();
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} sortValue
 * @returns {string}
 */
export function setSortSearch(searchParams, sortValue) {
  const next = new URLSearchParams(searchParams);
  next.set('sort', sortValue);
  next.delete('cursor');
  next.delete('direction');
  return next.toString();
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {string}
 */
export function clearFiltersSearch(searchParams) {
  const next = new URLSearchParams(searchParams);
  for (const group of FILTER_GROUPS) next.delete(group.param);
  next.delete('cursor');
  next.delete('direction');
  return next.toString();
}

/**
 * Apply the filter set to products that have already been decorated with
 * their metrics (weight, price breakdown).
 *
 * Price and weight are evaluated against the resolved numbers rather than
 * against Storefront facets, because weight here is a domain value the shop
 * enters as a metafield — it is not a native Shopify filter.
 *
 * @param {Array<{product: any, metrics: any}>} items
 * @param {Record<string, string[]>} filters
 */
export function applyFilters(items, filters) {
  return items.filter(({product, metrics}) => {
    for (const group of FILTER_GROUPS) {
      const selected = filters[group.param];
      if (!selected?.length) continue;

      const options = group.options.filter((o) => selected.includes(o.value));
      let matched = false;

      for (const option of options) {
        if (group.param === 'price') {
          const amount = Number(metrics?.price?.amount);
          if (
            Number.isFinite(amount) &&
            amount >= option.min &&
            amount < option.max
          ) {
            matched = true;
          }
        } else if (group.param === 'weight') {
          const grams = Number(metrics?.weightGrams);
          if (
            Number.isFinite(grams) &&
            grams >= option.min &&
            grams < option.max
          ) {
            matched = true;
          }
        } else if (group.param === 'type') {
          if (slugify(product?.productType) === option.value) matched = true;
        } else if (group.param === 'avail') {
          const ready = product?.availableForSale !== false;
          if (
            (option.value === 'ready' && ready) ||
            (option.value === 'made-to-order' && !ready)
          ) {
            matched = true;
          }
        }
      }

      // Values inside a group are OR'd; groups are AND'd.
      if (!matched) return false;
    }
    return true;
  });
}

/** @param {string|null|undefined} value */
export function slugify(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
