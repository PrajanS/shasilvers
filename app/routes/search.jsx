import {useLoaderData, Link} from 'react-router';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {SEARCH_PRODUCTS_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {useCollections} from '~/lib/collections';

/** @type {Route.MetaFunction} */
export const meta = ({data}) => [
  {title: data?.term ? `“${data.term}” — Sha Silvers` : 'Search — Sha Silvers'},
];

/**
 * Search results.
 *
 * Search is a primary control in this design, not an icon, so its results
 * page is the listing grid rather than a separate presentation.
 *
 * @param {Route.LoaderArgs} args
 */
export async function loader({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = (url.searchParams.get('q') ?? '').trim();

  const rates = await getMetalRates(storefront);
  const delivery = getDeliveryEstimate();

  if (!term) return {term, items: [], delivery};

  const {products} = await storefront.query(SEARCH_PRODUCTS_QUERY, {
    variables: {query: term, first: 24},
  });

  const items = (products?.nodes ?? []).map((product) => ({
    product,
    metrics: getProductMetrics({
      product,
      variant: product.selectedOrFirstAvailableVariant,
      rates,
    }),
  }));

  return {term, items, delivery};
}

export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {term, items, delivery} = useLoaderData();
  const collections = useCollections();

  return (
    <div className="search-page">
      <div className="search-page__head">
        <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: 'Search'}]} />
        <h1 className="t-display-l">
          {term ? `“${term}”` : 'Search silverware'}
        </h1>
        {term ? (
          <p className="listing__count">
            {items.length} article{items.length === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>

      {items.length ? (
        <div className="products-grid">
          {items.map(({product, metrics}, index) => (
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
          <p>
            {term
              ? `Nothing matches “${term}”.`
              : 'Search by article, category or occasion — pooja thali, diya, tumbler, gifting.'}
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
      )}
    </div>
  );
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
