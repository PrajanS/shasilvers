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
      {
        value: '10000-25000',
        label: '₹ 10,000 – 25,000',
        min: 10000,
        max: 25000,
      },
      {
        value: '25000-50000',
        label: '₹ 25,000 – 50,000',
        min: 25000,
        max: 50000,
      },
      {
        value: 'above-50000',
        label: 'Above ₹ 50,000',
        min: 50000,
        max: Infinity,
      },
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
    // Options are derived from the products on the page — see
    // `withTypeOptions`. A hardcoded list would go stale the moment the shop
    // starts selling something it did not sell when this file was written.
    param: 'type',
    label: 'Article type',
    options: [],
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

/**
 * Sort options.
 *
 * `sortKey`/`reverse` are what Shopify is asked for; `by` is how the resolved
 * items are ordered once they arrive.
 *
 * The two price sorts deliberately do **not** ask Shopify for `PRICE`. Shopify
 * would order by its own price field, and the grid renders the calculated one —
 * so wherever the two disagree the order was visibly wrong. They fetch in a
 * stable order and are sorted here, against the number actually on screen.
 * Like the price and weight facets, this orders the products fetched so far.
 *
 * Two sort-key enums exist and they are not interchangeable. A collection's
 * products take `ProductCollectionSortKeys` (`CREATED`); a top-level `products`
 * query — the catalogue and search — takes `ProductSortKeys` (`CREATED_AT`).
 * Each option carries both, and the caller picks with `sortKeyFor`.
 */
export const SORT_OPTIONS = [
  {
    value: 'price-asc',
    label: 'Price, low to high',
    sortKey: 'BEST_SELLING',
    productSortKey: 'BEST_SELLING',
    reverse: false,
    by: 'price',
    desc: false,
  },
  {
    value: 'price-desc',
    label: 'Price, high to low',
    sortKey: 'BEST_SELLING',
    productSortKey: 'BEST_SELLING',
    reverse: false,
    by: 'price',
    desc: true,
  },
  {
    value: 'newest',
    label: 'Newest first',
    sortKey: 'CREATED',
    productSortKey: 'CREATED_AT',
    reverse: true,
    by: null,
    desc: false,
  },
  {
    value: 'popular',
    label: 'Most popular',
    sortKey: 'BEST_SELLING',
    productSortKey: 'BEST_SELLING',
    reverse: false,
    by: null,
    desc: false,
  },
];

/**
 * Search offers one more: what Shopify thinks matches the term best.
 *
 * It leads the list and is the default there, because reordering a search by
 * price would bury the article the buyer actually typed the name of.
 * `RELEVANCE` is only meaningful alongside a `query`, so it is not offered on
 * a listing.
 */
export const RELEVANCE_SORT = {
  value: 'relevance',
  label: 'Best match',
  sortKey: 'RELEVANCE',
  productSortKey: 'RELEVANCE',
  reverse: false,
  by: null,
  desc: false,
};

export const SEARCH_SORT_OPTIONS = [RELEVANCE_SORT, ...SORT_OPTIONS];

export const DEFAULT_SORT = 'price-asc';
export const SEARCH_DEFAULT_SORT = 'relevance';

/**
 * @param {string} value
 * @param {Array<any>} [options] The list this surface offers; the first is its
 *   default, so an unknown or out-of-context value falls back sensibly.
 */
export function getSort(value, options = SORT_OPTIONS) {
  return options.find((o) => o.value === value) ?? options[0];
}

/**
 * The enum member to send, for the query being made.
 * @param {any} sort
 * @param {'collection'|'product'} kind
 */
export function sortKeyFor(sort, kind) {
  return kind === 'product' ? sort.productSortKey : sort.sortKey;
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

/**
 * The filter groups, with the article-type options derived from what is
 * actually in this grid.
 *
 * A type with no products on the page is not offered — a facet that can only
 * ever return nothing is worse than no facet.
 *
 * @param {Array<{product: any}>} items
 * @returns {typeof FILTER_GROUPS}
 */
export function withTypeOptions(items) {
  /** @type {Map<string, string>} */
  const seen = new Map();
  for (const {product} of items ?? []) {
    const label = product?.productType?.trim();
    if (!label) continue;
    const value = slugify(label);
    if (value && !seen.has(value)) seen.set(value, label);
  }

  const options = [...seen.entries()]
    .map(([value, label]) => ({value, label}))
    .sort((a, b) => a.label.localeCompare(b.label));

  return FILTER_GROUPS.map((group) =>
    group.param === 'type' ? {...group, options} : group,
  );
}

/**
 * Order the resolved items for the chosen sort.
 *
 * Only the price sorts reorder anything: everything else keeps the order
 * Shopify returned, which is the order it was asked for.
 *
 * @param {Array<{product: any, metrics: any}>} items
 * @param {{by?: string|null, desc?: boolean}} sort
 */
export function sortItems(items, sort) {
  if (sort?.by !== 'price') return items;

  // An article with no resolvable price sinks to the bottom either way, rather
  // than sorting as zero and leading a low-to-high list.
  const amountOf = (item) => {
    const n = Number(item?.metrics?.price?.amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  return [...items].sort((a, b) => {
    const x = amountOf(a);
    const y = amountOf(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return sort.desc ? y - x : x - y;
  });
}

/**
 * Chips for the applied filters, resolved against the groups actually offered.
 * @param {Record<string, string[]>} filters
 * @param {typeof FILTER_GROUPS} groups
 */
export function getActiveChipsFor(filters, groups) {
  const chips = [];
  for (const group of groups) {
    for (const value of filters[group.param] ?? []) {
      const option = group.options.find((o) => o.value === value);
      if (option) chips.push({param: group.param, value, label: option.label});
    }
  }
  return chips;
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
