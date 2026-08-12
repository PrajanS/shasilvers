import {useLoaderData, Link} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {Button} from '~/components/Button';
import {MediaWell} from '~/components/MediaWell';
import {ProductTile} from '~/components/ProductTile';
import {TrustRow} from '~/components/TrustRow';
import {MakerBand} from '~/components/MakerBand';
import {FEATURED_PRODUCTS_QUERY} from '~/lib/product-queries';
import {isDemoMode} from '~/lib/demo/mode';
import {queryDemoProducts} from '~/lib/demo/catalogue';
import {getProductMetrics} from '~/lib/pricing';
import {getSilverRate} from '~/lib/silver-rate.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {CATEGORIES} from '~/lib/shop';

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
  const {storefront, env} = context;
  const rate = getSilverRate();
  const delivery = getDeliveryEstimate();

  // DEMO: serve the Sha Silvers catalogue when no store is connected.
  const products = isDemoMode(env)
    ? queryDemoProducts({first: 8, sortKey: 'BEST_SELLING'})
    : (
        await storefront.query(FEATURED_PRODUCTS_QUERY, {
          variables: {first: 8},
          cache: storefront.CacheShort(),
        })
      ).products;

  const items = (products?.nodes ?? []).map((product) => ({
    product,
    metrics: getProductMetrics({product, ratePerGram: rate.ratePerGram}),
  }));

  return {items, delivery};
}

export default function Home() {
  /** @type {LoaderReturnData} */
  const {items, delivery} = useLoaderData();

  return (
    <>
      <Hero />
      <CategoryStrip />

      <section className="section">
        <div className="section__head">
          <h2 className="t-display-m">Ready to despatch</h2>
          <div className="section__filters">
            <Link to="/collections/pooja-articles">All</Link>
            <Link to="/collections/pooja-articles?price=under-10000">
              Under ₹ 10,000
            </Link>
            <Link to="/collections/pooja-articles?weight=under-100">
              Under 100 g
            </Link>
            <Link to="/collections/gifting">Gift-ready</Link>
            <Link className="link-inline" to="/collections/pooja-articles">
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
            No articles are published yet. Add products to your Shopify catalogue
            and they will appear here.
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
            <Button to="/collections/pooja-articles" variant="primary">
              Shop pooja sets
            </Button>
            <Button to="/collections/dining-thali" variant="secondary">
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
            to: '/collections/bulk-corporate',
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
  return (
    <nav className="category-strip" aria-label="Shop by category">
      {CATEGORIES.map((category) => (
        <Link
          className="category-strip__item"
          key={category.handle}
          to={`/collections/${category.handle}`}
          prefetch="intent"
        >
          <MediaWell note="1:1" sizes="(min-width: 901px) 12vw, 25vw" />
          <span>{category.short}</span>
        </Link>
      ))}
    </nav>
  );
}

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
