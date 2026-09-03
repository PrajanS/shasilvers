import {useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ALL_PRODUCTS_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';

/**
 * Everything the shop sells, in one paginated grid.
 *
 * This used to be the unmigrated Hydrogen skeleton, and it quoted Shopify's own
 * price through `<Money>` while every other surface quoted the calculated one —
 * the same article at two different prices depending on the route. It now runs
 * the same query, the same metrics and the same tile as the category listing,
 * so there is one price in the storefront and one place it comes from.
 *
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'All silverware — Sha Silvers'},
    {
      name: 'description',
      content:
        'Every article we make, priced at today’s metal rate plus making charge.',
    },
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader({context, request}) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });

  // Rates and the delivery date are resolved per route, as everywhere else;
  // the ten-minute cache is what keeps the routes agreeing.
  const [rates, {products}] = await Promise.all([
    getMetalRates(storefront),
    storefront.query(ALL_PRODUCTS_QUERY, {
      variables: {...paginationVariables, sortKey: 'BEST_SELLING'},
    }),
  ]);

  return {products, rates, delivery: getDeliveryEstimate()};
}

export default function AllProducts() {
  /** @type {LoaderReturnData} */
  const {products, rates, delivery} = useLoaderData();

  return (
    <div className="listing listing--full">
      <Breadcrumbs
        trail={[{label: 'Home', to: '/'}, {label: 'All silverware'}]}
      />

      <div className="listing__head">
        <div>
          <h1 className="t-display-l">All silverware</h1>
          <p className="listing__count">
            Every article we make · priced at today’s metal rate + making
          </p>
        </div>
      </div>

      <PaginatedResourceSection
        connection={products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductTile
            key={product.id}
            product={product}
            metrics={getProductMetrics({
              product,
              variant: product.selectedOrFirstAvailableVariant,
              rates,
            })}
            deliveryDate={delivery.short}
            loading={index < 8 ? 'eager' : 'lazy'}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

/** @typedef {import('./+types/collections.all').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
