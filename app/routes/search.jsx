import {useLoaderData, useSearchParams, Link} from 'react-router';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {
  FacetForm,
  ListingControls,
  useListingFilters,
} from '~/components/ListingControls';
import {SEARCH_PRODUCTS_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {useCollections} from '~/lib/collections';
import {
  SEARCH_SORT_OPTIONS,
  SEARCH_DEFAULT_SORT,
  applyFilters,
  clearFiltersSearch,
  getSort,
  sortItems,
  sortKeyFor,
} from '~/lib/collection-filters';

/** @type {Route.MetaFunction} */
export const meta = ({data}) => [
  {title: data?.term ? `“${data.term}” — Sha Silvers` : 'Search — Sha Silvers'},
];

/**
 * Search results.
 *
 * Search is a primary control in this design, not an icon, so its results page
 * is the listing grid rather than a separate presentation — and it carries the
 * same facet rail and sort as a category listing. Someone who searches
 * "tumbler" and someone who opens the tumblers collection are doing the same
 * thing, and used to get different controls for it.
 *
 * Default sort is relevance, not price: reordering by price would bury the
 * article whose name was typed.
 *
 * @param {Route.LoaderArgs} args
 */
export async function loader({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = (url.searchParams.get('q') ?? '').trim();
  const sort = getSort(
    url.searchParams.get('sort') ?? SEARCH_DEFAULT_SORT,
    SEARCH_SORT_OPTIONS,
  );

  const rates = await getMetalRates(storefront);
  const delivery = getDeliveryEstimate();

  if (!term) return {term, items: [], rates, delivery};

  const {products} = await storefront.query(SEARCH_PRODUCTS_QUERY, {
    variables: {
      query: term,
      first: 48,
      sortKey: sortKeyFor(sort, 'product'),
      reverse: sort.reverse,
    },
  });

  const items = (products?.nodes ?? []).map((product) => ({
    product,
    metrics: getProductMetrics({
      product,
      variant: product.selectedOrFirstAvailableVariant,
      rates,
    }),
  }));

  return {term, items, rates, delivery};
}

export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {term, items, rates, delivery} = useLoaderData();
  const [searchParams] = useSearchParams();
  const collections = useCollections();

  const {filters, groups, chips, activeSort, sortOptions} = useListingFilters(
    searchParams,
    items,
    {options: SEARCH_SORT_OPTIONS, defaultSort: SEARCH_DEFAULT_SORT},
  );

  // Filtered and ordered against the resolved numbers, exactly as the listing
  // does it — price and weight are metafield-derived, not Shopify facets.
  const visible = sortItems(applyFilters(items, filters), activeSort);

  // No term means nothing to filter; show the category prompt on its own.
  if (!term) {
    return (
      <div className="listing listing--full">
        <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: 'Search'}]} />
        <div className="listing__head">
          <div>
            <h1 className="t-display-l">Search silverware</h1>
          </div>
        </div>
        <div className="empty-state">
          <p>
            Search by article, category or occasion — pooja thali, diya,
            tumbler, gifting.
          </p>
          <div className="chip-row" style={{marginTop: 16}}>
            {collections.slice(0, 5).map((collection) => (
              <Link
                key={collection.id}
                className="chip"
                to={`/collections/${collection.handle}`}
              >
                {collection.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="listing">
      <aside className="listing__aside" aria-label="Filters">
        <FacetForm
          filters={filters}
          groups={groups}
          sortOptions={sortOptions}
          searchParams={searchParams}
          rates={rates}
          activeSort={activeSort}
          idPrefix="rail"
        />
      </aside>

      <div>
        <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: 'Search'}]} />

        <div className="listing__head">
          <div>
            <h1 className="t-display-l">“{term}”</h1>
            <p className="listing__count">
              {visible.length} article{visible.length === 1 ? '' : 's'}
              {visible.length !== items.length
                ? ` of ${items.length} found`
                : ''}
            </p>
          </div>
        </div>

        <ListingControls
          filters={filters}
          groups={groups}
          chips={chips}
          sortOptions={sortOptions}
          searchParams={searchParams}
          rates={rates}
          activeSort={activeSort}
        />

        {visible.length ? (
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
        ) : (
          <div className="empty-state">
            {/* Two different failures, said differently: the term found
                nothing, or the term found things the filters then excluded. */}
            {items.length ? (
              <p>
                Nothing matches these filters.{' '}
                <Link
                  className="link-inline"
                  to={`?${clearFiltersSearch(searchParams)}`}
                >
                  Clear all
                </Link>
              </p>
            ) : (
              <>
                <p>Nothing matches “{term}”.</p>
                <div className="chip-row" style={{marginTop: 16}}>
                  {collections.slice(0, 5).map((collection) => (
                    <Link
                      key={collection.id}
                      className="chip"
                      to={`/collections/${collection.handle}`}
                    >
                      {collection.title}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
