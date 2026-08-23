import {
  useLoaderData,
  useSearchParams,
  useSubmit,
  Link,
  Form,
} from 'react-router';
import {getPaginationVariables, Analytics, Pagination} from '@shopify/hydrogen';
import {useId, useRef, useState} from 'react';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {COLLECTION_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {formatAmount} from '~/lib/money';
import {
  FILTER_GROUPS,
  SORT_OPTIONS,
  DEFAULT_SORT,
  applyFilters,
  clearFiltersSearch,
  getActiveChips,
  getSort,
  parseFilters,
  toggleFilterSearch,
} from '~/lib/collection-filters';

/** @type {Route.MetaFunction} */
export const meta = ({data}) => {
  return [{title: `${data?.title ?? 'Silverware'} — Sha Silvers`}];
};

/**
 * Category listing.
 *
 * Filters, sort and the pagination cursor are all query-string state, so a
 * filtered listing is linkable and survives a reload. Applied filters appear
 * as removable chips above the grid, and the count and sort sit above the
 * fold beside them.
 *
 * @param {Route.LoaderArgs} args
 */
export async function loader({context, params, request}) {
  const {storefront} = context;
  const {handle} = params;
  const url = new URL(request.url);

  const sort = getSort(url.searchParams.get('sort') ?? DEFAULT_SORT);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const rates = await getMetalRates(storefront);
  const delivery = getDeliveryEstimate();

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      sortKey: sort.sortKey,
      reverse: sort.reverse,
      ...paginationVariables,
    },
  });

  // A listing shows exactly what Shopify has in that collection. There is no
  // fall back to the full catalogue: a product appears here only if it was
  // put in this collection, and a handle the store does not have is a 404.
  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  return {
    title: collection.title,
    description: collection.description,
    products: collection.products,
    collectionId: collection.id,
    handle: collection.handle,
    rates,
    delivery,
  };
}

/**
 * How the listing states the day's rate above the grid.
 *
 * A collection can hold more than one metal, so naming a single figure is
 * only honest when the shop publishes exactly one rate. Beyond that the line
 * says what is true of every article in the grid without picking a number.
 *
 * @param {{list?: Array<any>, currencyCode?: string}} rates
 */
function ratePhrase(rates) {
  const list = rates?.list ?? [];
  if (!list.length) return 'today’s metal rate';

  if (list.length === 1) {
    const [only] = list;
    return `${formatAmount(only.ratePerGram, rates.currencyCode, {
      decimals: true,
    })}/g`;
  }

  return `today’s ${list.map((entry) => entry.metal).join(' and ')} rate`;
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {title, products, collectionId, handle, rates, delivery} =
    useLoaderData();
  const [searchParams] = useSearchParams();
  const [panel, setPanel] = useState(null); // null | 'filter' | 'sort'
  const sortRef = useRef(null);
  const panelId = useId();

  const filters = parseFilters(searchParams);
  const chips = getActiveChips(filters);
  const activeSort = getSort(searchParams.get('sort') ?? DEFAULT_SORT);

  return (
    <div className="listing">
      <aside className="listing__aside" aria-label="Filters">
        <FacetForm
          filters={filters}
          searchParams={searchParams}
          rates={rates}
          activeSort={activeSort}
          idPrefix="rail"
        />
      </aside>

      <div>
        <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: title}]} />

        <div className="listing__head">
          <div>
            <h1 className="t-display-l">{title}</h1>
            <p className="listing__count">
              All BIS hallmarked · priced at {ratePhrase(rates)} + making
            </p>
          </div>
        </div>

        {/*
          Mobile: the facet column is hidden, so both controls open the same
          panel. Sort focuses the select inside it — previously this button
          closed the panel and did nothing else, leaving mobile unable to sort.
        */}
        <div className="listing-bar">
          <button
            type="button"
            aria-expanded={panel === 'filter'}
            aria-controls={panelId}
            onClick={() => setPanel(panel === 'filter' ? null : 'filter')}
          >
            Filter{chips.length ? ` · ${chips.length}` : ''}
          </button>
          <button
            type="button"
            aria-expanded={panel === 'sort'}
            aria-controls={panelId}
            onClick={() => {
              setPanel(panel === 'sort' ? null : 'sort');
              // Let the panel mount before reaching for the control inside it.
              requestAnimationFrame(() => sortRef.current?.focus());
            }}
          >
            Sort · {activeSort.label}
          </button>
        </div>

        {panel ? (
          <div className="facet-panel" id={panelId}>
            <div className="facet-panel__head">
              <span className="t-label">
                {panel === 'sort' ? 'Sort' : 'Filter'}
              </span>
              <button
                type="button"
                className="facet-panel__close"
                onClick={() => setPanel(null)}
              >
                Done
              </button>
            </div>
            <FacetForm
              filters={filters}
              searchParams={searchParams}
              rates={rates}
              activeSort={activeSort}
              sortRef={sortRef}
              idPrefix="panel"
            />
          </div>
        ) : null}

        {chips.length ? (
          <div className="applied-filters">
            <span className="applied-filters__label">Filters</span>
            {chips.map((chip) => (
              <Link
                key={`${chip.param}-${chip.value}`}
                className="filter-chip"
                preventScrollReset
                to={`?${toggleFilterSearch(searchParams, chip.param, chip.value)}`}
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <span className="filter-chip__x" aria-hidden="true">
                  ×
                </span>
              </Link>
            ))}
            <Link
              className="link-inline"
              preventScrollReset
              to={`?${clearFiltersSearch(searchParams)}`}
            >
              Clear all
            </Link>
          </div>
        ) : null}

        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, hasNextPage}) => {
            // Metrics are derived here rather than in the loader so that
            // pages accumulated by <Pagination> are decorated too.
            const decorated = nodes.map((product) => ({
              product,
              metrics: getProductMetrics({
                product,
                variant: product.selectedOrFirstAvailableVariant,
                rates,
              }),
            }));
            const visible = applyFilters(decorated, filters);

            if (!visible.length) {
              // Filters are applied to the pages fetched so far, so a later
              // page can legitimately contain no matches while earlier ones
              // do. Say that, rather than implying the filter found nothing.
              const onLaterPage = Boolean(searchParams.get('cursor'));
              const fromStart = new URLSearchParams(searchParams);
              fromStart.delete('cursor');
              fromStart.delete('direction');

              return (
                <p className="empty-state">
                  {onLaterPage ? (
                    <>
                      No further matches on this page.{' '}
                      <Link className="link-inline" to={`?${fromStart}`}>
                        Back to the start of the listing
                      </Link>
                    </>
                  ) : (
                    <>
                      Nothing matches these filters.{' '}
                      <Link
                        className="link-inline"
                        to={`?${clearFiltersSearch(searchParams)}`}
                      >
                        Clear all
                      </Link>
                    </>
                  )}
                </p>
              );
            }

            return (
              <>
                <div className="products-grid">
                  {visible.map(({product, metrics}, index) => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      metrics={metrics}
                      deliveryDate={delivery.short}
                      loading={index < 8 ? 'eager' : 'lazy'}
                    />
                  ))}
                </div>

                <div className="listing__foot">
                  <span className="listing__showing">
                    Showing {visible.length} article
                    {visible.length === 1 ? '' : 's'}
                    {visible.length !== decorated.length
                      ? ` of ${decorated.length} loaded`
                      : ''}
                  </span>
                  {hasNextPage ? (
                    <NextLink className="btn btn--secondary">
                      {isLoading ? 'Loading…' : 'Load 24 more'}
                    </NextLink>
                  ) : null}
                </div>
              </>
            );
          }}
        </Pagination>
      </div>

      {collectionId ? (
        <Analytics.CollectionView
          data={{collection: {id: collectionId, handle}}}
        />
      ) : null}
    </div>
  );
}

/**
 * Filters and sort, as one real form.
 *
 * These used to be links with a decorative `<input type="checkbox">` inside
 * them — which announced an uncheckable checkbox nested in a link, and lied
 * to every screen reader. They are now genuine checkboxes in a GET form, so
 * the control the buyer operates is the control assistive tech reports.
 *
 * Submitting on change keeps the URL as the single source of truth. Every
 * filter lives in this one form, so nothing has to be threaded through hidden
 * inputs, and the pagination cursor is dropped naturally by not being here.
 * Without JavaScript the Apply button submits it.
 *
 * @param {{
 *   filters: Record<string,string[]>,
 *   searchParams: URLSearchParams,
 *   rates: any,
 *   activeSort: any,
 *   sortRef?: any,
 *   idPrefix?: string,
 * }} props
 */
function FacetForm({
  filters,
  searchParams,
  rates,
  activeSort,
  sortRef,
  idPrefix,
}) {
  const submit = useSubmit();
  const generatedId = useId();
  const sortId = `sort-${idPrefix ?? generatedId}`;
  const query = searchParams.get('q');

  return (
    <Form
      method="get"
      className="facets"
      // Checkboxes are uncontrolled, so remount them whenever the URL changes
      // — otherwise removing a filter via its chip leaves the box still ticked.
      key={searchParams.toString()}
      onChange={(event) =>
        submit(event.currentTarget, {preventScrollReset: true})
      }
    >
      {/* Preserved across a filter change; the cursor deliberately is not. */}
      {query ? <input type="hidden" name="q" value={query} readOnly /> : null}

      <div className="facets__group">
        <label className="facets__title" htmlFor={sortId}>
          Sort
        </label>
        <div className="sort-control sort-control--panel">
          <select
            id={sortId}
            name="sort"
            ref={sortRef}
            defaultValue={activeSort.value}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {FILTER_GROUPS.map((group) => (
        <fieldset className="facets__group" key={group.param}>
          <legend className="facets__title">{group.label}</legend>
          <div className="facets__options">
            {group.options.map((option) => {
              const checked = (filters[group.param] ?? []).includes(
                option.value,
              );
              const label =
                group.param === 'price' && rates.currencyCode !== 'INR'
                  ? priceLabelFor(option, rates.currencyCode)
                  : option.label;

              return (
                <label className="checkbox-row" key={option.value}>
                  <input
                    type="checkbox"
                    name={group.param}
                    value={option.value}
                    defaultChecked={checked}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <noscript>
        <button type="submit" className="btn btn--outline facets__apply">
          Apply filters
        </button>
      </noscript>
    </Form>
  );
}

/**
 * The price bands are written in rupees in the design. When the storefront is
 * trading in another currency, relabel them with that symbol so the filter
 * never contradicts the prices beside it.
 * @param {{min: number, max: number}} option
 * @param {string} currencyCode
 */
function priceLabelFor(option, currencyCode) {
  if (option.min === 0)
    return `Under ${formatAmount(option.max, currencyCode)}`;
  if (!Number.isFinite(option.max)) {
    return `Above ${formatAmount(option.min, currencyCode)}`;
  }
  return `${formatAmount(option.min, currencyCode)} – ${formatAmount(
    option.max,
    currencyCode,
  )}`;
}

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
