import {useLoaderData, Link} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {Button} from '~/components/Button';
import {MediaWell} from '~/components/MediaWell';
import {ProductTile} from '~/components/ProductTile';
import {TrustRow} from '~/components/TrustRow';
import {MakerBand} from '~/components/MakerBand';
import {FEATURED_PRODUCTS_QUERY} from '~/lib/product-queries';
import {getProductMetrics} from '~/lib/pricing';
import {getMetalRates} from '~/lib/metal-rates.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {useCollections, useCollectionPath} from '~/lib/collections';

/** @type {Route.MetaFunction} */
export const meta = () => {
  return [
    {title: 'Sha Silvers — 925 sterling silverware, made in our workshop'},
    {
      name: 'description',
      content:
        'Pooja thalis, plates, spoons, tumblers, diyas and idols in BIS hallmarked 925 silver. Priced at today’s rate plus making, with nothing added at checkout.',
    },
  ];
};

/**
 * The first screen has to do the selling: search, all eight categories,
 * today's rate and the first row of buyable product are all reachable without
 * scrolling.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const {storefront} = context;
  const rates = await getMetalRates(storefront);
  const delivery = getDeliveryEstimate();

  const {products} = await storefront.query(FEATURED_PRODUCTS_QUERY, {
    variables: {first: 8},
    cache: storefront.CacheShort(),
  });

  const items = (products?.nodes ?? []).map((product) => ({
    product,
    metrics: getProductMetrics({product, rates}),
  }));

  return {items, delivery};
}

export default function Home() {
  /** @type {LoaderReturnData} */
  const {items, delivery} = useLoaderData();
  const featured = useCollectionPath('pooja-articles', 'pooja');
  const giftPath = useCollectionPath('gifting');

  return (
    <>
      <Hero />
      <CategoryStrip />

      <section className="section">
        <div className="section__head">
          <h2 className="t-display-m">Ready to despatch</h2>
          <div className="section__filters">
            <Link to={featured}>All</Link>
            <Link to={`${featured}?price=under-10000`}>Under ₹ 10,000</Link>
            <Link to={`${featured}?weight=under-100`}>Under 100 g</Link>
            <Link to={giftPath}>Gift-ready</Link>
            <Link className="link-inline" to={featured}>
              View all →
            </Link>
          </div>
        </div>

        {items.length ? (
          <div className="products-grid">
            {items.map(({product, metrics}, index) => (
              <ProductTile
                key={product.id}
                product={product}
                metrics={metrics}
                deliveryDate={delivery.short}
                loading={index < 4 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No articles are published yet. Add products to your Shopify
            catalogue and they will appear here.
          </p>
        )}
      </section>

      <MakerBand compact />

      <TrustRow />

      <Analytics.CustomView type="custom_home_viewed" />
    </>
  );
}

function Hero() {
  // Editorial links name the collection they mean; the handle is the shop's
  // to rename, so each resolves against the live list.
  const poojaPath = useCollectionPath('pooja-articles', 'pooja');
  const diningPath = useCollectionPath('dining-and-thali', 'dining-thali');
  const bulkPath = useCollectionPath('bulk-and-corporate', 'bulk-corporate');

  return (
    <section className="hero">
      <div className="hero__main">
        <div className="hero__copy">
          <div className="hero__eyebrow">Wedding &amp; housewarming</div>
          <h1 className="t-display-xl">
            Pooja thali sets, made in our own workshop
          </h1>
          <p>
            Hallmarked 925. Priced at today’s rate plus making — no hidden
            charge at checkout.
          </p>
          <div className="hero__actions">
            <Button to={poojaPath} variant="primary">
              Shop pooja sets
            </Button>
            <Button to={diningPath} variant="secondary">
              All silverware
            </Button>
          </div>
        </div>
        <MediaWell
          className="hero__media"
          aspect="16/9"
          note="16:9 crop · thali set on sand, piece right of centre"
        />
      </div>

      <div className="hero__side">
        {[
          {
            title: 'Buy by weight',
            detail: 'Tell us the grammage, we quote instantly.',
            to: '/pages/buy-by-weight',
          },
          {
            title: 'Bulk & corporate gifting',
            detail: '25 pieces and above, GST invoice.',
            to: bulkPath,
          },
          {
            title: 'Exchange old silver',
            detail: 'Buyback at today’s rate.',
            to: '/pages/buyback',
          },
          {
            title: 'Track your order',
            detail: 'Order number or phone.',
            to: '/account/orders',
          },
        ].map((item) => (
          <Link className="hero__side-item" key={item.title} to={item.to}>
            <span className="hero__side-title">{item.title}</span>
            <span className="hero__side-detail">{item.detail}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CategoryStrip() {
  const collections = useCollections();

  if (!collections.length) return null;

  return (
    <nav className="category-strip" aria-label="Shop by category">
      {collections.map((collection) => (
        <Link
          className="category-strip__item"
          key={collection.id}
          to={`/collections/${collection.handle}`}
          prefetch="intent"
        >
          <MediaWell
            data={collection.image}
            note={`1:1 · ${collection.title}`}
            sizes="(min-width: 901px) 12vw, 25vw"
          />
          <span>{collection.title}</span>
        </Link>
      ))}
    </nav>
  );
}

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
