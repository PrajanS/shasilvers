import {useLoaderData, Link} from 'react-router';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {SEARCH_PRODUCTS_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getSilverRate} from '~/lib/silver-rate.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {isDemoMode} from '~/lib/demo/mode';
import {queryDemoProducts} from '~/lib/demo/catalogue';
import {CATEGORIES} from '~/lib/shop';

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
  const {storefront, env} = context;
  const url = new URL(request.url);
  const term = (url.searchParams.get('q') ?? '').trim();

  const rate = getSilverRate();
  const delivery = getDeliveryEstimate();

  if (!term) return {term, items: [], rate, delivery};

  // DEMO: search the Sha Silvers catalogue when no store is connected.
  const products = isDemoMode(env)
    ? queryDemoProducts({query: term, first: 24})
    : (
        await storefront.query(SEARCH_PRODUCTS_QUERY, {
          variables: {query: term, first: 24},
        })
      ).products;

  const items = (products?.nodes ?? []).map((product) => ({
    product,
    metrics: getProductMetrics({
      product,
      variant: product.selectedOrFirstAvailableVariant,
      ratePerGram: rate.ratePerGram,
    }),
  }));

  return {term, items, rate, delivery};
}

export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {term, items, delivery} = useLoaderData();

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
            {CATEGORIES.slice(0, 5).map((category) => (
              <Link
                key={category.handle}
                className="chip"
                to={`/collections/${category.handle}`}
              >
                {category.label}
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
