import {useLoaderData, useSearchParams, Link} from 'react-router';
import {getPaginationVariables, Analytics, Pagination} from '@shopify/hydrogen';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {
  FacetForm,
  ListingControls,
  useListingFilters,
} from '~/components/ListingControls';
import {COLLECTION_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {formatAmount} from '~/lib/money';
import {
  DEFAULT_SORT,
  applyFilters,
  clearFiltersSearch,
  getSort,
  sortItems,
  sortKeyFor,
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
      // A collection's products take ProductCollectionSortKeys, not the
      // ProductSortKeys the catalogue and search use.
      sortKey: sortKeyFor(sort, 'collection'),
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

  // Article types are whatever this grid actually contains, not a fixed list.
  const {filters, groups, chips, activeSort} = useListingFilters(
    searchParams,
    (products?.nodes ?? []).map((product) => ({product})),
  );

  return (
    <div className="listing">
      <aside className="listing__aside" aria-label="Filters">
        <FacetForm
          filters={filters}
          groups={groups}
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

        <ListingControls
          filters={filters}
          groups={groups}
          chips={chips}
          searchParams={searchParams}
          rates={rates}
          activeSort={activeSort}
        />

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
            // Filtered, then ordered by the price actually on screen — see
            // `sortItems`. Both operate on the pages fetched so far.
            const visible = sortItems(
              applyFilters(decorated, filters),
              activeSort,
            );

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


/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
