import {Suspense, useEffect, useState} from 'react';
import {Await, useLoaderData, useNavigate, Link} from 'react-router';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  CartForm,
} from '@shopify/hydrogen';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {MediaWell} from '~/components/MediaWell';
import {PriceBreakdown} from '~/components/PriceBreakdown';
import {SpecTable} from '~/components/SpecTable';
import {Accordion} from '~/components/Accordion';
import {AddToCartButton} from '~/components/AddToCartButton';
import {ProductTile} from '~/components/ProductTile';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {MakerBand} from '~/components/MakerBand';
import {useAside} from '~/components/Aside';
import {RECOMMENDED_PRODUCTS_QUERY} from '~/lib/product-queries';
import {isDemoMode} from '~/lib/demo/mode';
import {
  getDemoProduct,
  getDemoProducts,
  getDemoProductOptions,
  getDemoOptionsField,
  selectVariant,
  toTile,
} from '~/lib/demo/catalogue';
import {getProductMetrics} from '~/lib/pricing';
import {getSilverRate} from '~/lib/silver-rate.server';
import {getDeliveryEstimate} from '~/lib/delivery';
import {formatGrams, formatMoney} from '~/lib/money';

/** @type {Route.MetaFunction} */
export const meta = ({data}) => {
  return [
    {title: `${data?.product?.title ?? 'Article'} — Sha Silvers`},
    {rel: 'canonical', href: `/products/${data?.product?.handle}`},
    {
      name: 'description',
      content:
        data?.product?.description?.slice(0, 155) ??
        'BIS hallmarked 925 sterling silverware, made in our Coimbatore workshop.',
    },
  ];
};

/** @param {Route.LoaderArgs} args */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

/** @param {Route.LoaderArgs} args */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront, env} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  // DEMO: resolve from the Sha Silvers catalogue, including which variant the
  // current query string selects, so option chips behave as they would live.
  if (isDemoMode(env)) {
    const demoProduct = getDemoProduct(handle);
    if (!demoProduct) throw new Response(null, {status: 404});

    const selectedOptions = Object.fromEntries(
      getSelectedProductOptions(request).map(({name, value}) => [name, value]),
    );
    const selectedVariant = selectVariant(demoProduct, selectedOptions);

    return {
      product: {
        ...demoProduct,
        // Fields Hydrogen's variant hooks expect to exist.
        adjacentVariants: [],
        encodedVariantExistence: null,
        encodedVariantAvailability: null,
        options: getDemoOptionsField(demoProduct),
        selectedOrFirstAvailableVariant: selectedVariant,
      },
      demo: true,
      rate: getSilverRate(),
      delivery: getDeliveryEstimate(),
    };
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) throw new Response(null, {status: 404});

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
    demo: false,
    rate: getSilverRate(),
    delivery: getDeliveryEstimate(),
  };
}

/**
 * Recommendations sit below the fold, so they must never block the buy
 * controls — and must never take the page down if the store has none.
 * @param {Route.LoaderArgs} args
 */
function loadDeferredData({context, params}) {
  if (isDemoMode(context.env)) {
    const current = getDemoProduct(params.handle);
    return {
      recommended: Promise.resolve(
        getDemoProducts()
          .filter(
            (product) =>
              product.category === current?.category &&
              product.handle !== current?.handle,
          )
          .slice(0, 4)
          .map((product) => toTile(product)),
      ),
    };
  }

  const recommended = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY, {variables: {handle: params.handle}})
    .then((result) => result?.product?.collections?.nodes?.[0]?.products?.nodes ?? [])
    .catch(() => []);

  return {recommended};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, demo, rate, delivery, recommended} = useLoaderData();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Hooks above stay unconditional; only the option-list builder differs,
  // and both builders return the same shape so the chips render identically.
  const productOptions = demo
    ? getDemoProductOptions(product, selectedVariant)
    : getProductOptions({
        ...product,
        selectedOrFirstAvailableVariant: selectedVariant,
      });

  const metrics = getProductMetrics({
    product,
    variant: selectedVariant,
    ratePerGram: rate.ratePerGram,
  });

  const [activeImage, setActiveImage] = useState(0);
  const images = product.images?.nodes ?? [];
  const gallery = images.length
    ? images
    : selectedVariant?.image
      ? [selectedVariant.image]
      : [];

  const inStock = Boolean(selectedVariant?.availableForSale);

  return (
    <div className="pdp">
      <Breadcrumbs
        trail={[
          {label: 'Home', to: '/'},
          product.category
            ? {
                label: product.productType || 'Silverware',
                to: `/collections/${product.category}`,
              }
            : null,
          {label: product.title},
        ].filter(Boolean)}
      />

      <div className="pdp__grid">
        {/* Only render the strip when there is genuinely more than one image
            to choose between; five inert placeholders taught nothing. */}
        {gallery.length > 1 ? (
          <div className="pdp__thumbs">
            {gallery.map((image, index) => (
              <button
                type="button"
                key={image?.id ?? index}
                className="pdp__thumb"
                aria-current={activeImage === index ? 'true' : undefined}
                aria-label={`View image ${index + 1} of ${gallery.length}`}
                onClick={() => setActiveImage(index)}
              >
                <MediaWell data={image} note="1:1" sizes="96px" />
              </button>
            ))}
          </div>
        ) : null}

        <MediaWell
          className="pdp__gallery"
          data={gallery[activeImage] ?? gallery[0]}
          note={'1:1 primary · thali centred on sand'}
          sizes="(min-width: 1101px) 45vw, 100vw"
          loading="eager"
        />

        <div className="pdp__main">
          <div className="pdp__eyebrow">
            {product.productType || 'Silverware'} ·{' '}
            {inStock ? 'ready to despatch' : 'made to order'}
          </div>

          <h1 className="t-display-l pdp__title">{product.title}</h1>

          {(metrics.articleCode || metrics.huid) && (
            <div className="pdp__code">
              {metrics.articleCode ? `Article ${metrics.articleCode}` : null}
              {metrics.articleCode && metrics.huid ? ' · ' : null}
              {metrics.huid ? `BIS HUID ${metrics.huid}` : null}
            </div>
          )}

          <div className="pdp__price-row">
            <span className="t-price-lg">{formatMoney(selectedVariant?.price)}</span>
            <span className="pdp__tax-note">GST included</span>
          </div>

          <PriceBreakdown
            breakdown={metrics.breakdown}
            marketRate={rate.market}
            className="pdp__breakdown"
            explainMaking
          />

          <ul className="pdp__assurances">
            <li>
              <span className="pdp__tick" aria-hidden="true">
                ✓
              </span>
              {inStock
                ? 'In stock · despatched in 2 working days'
                : 'Made to order · 10–14 working days'}
            </li>
            <li>
              <span className="pdp__tick" aria-hidden="true">
                ✓
              </span>
              Delivery by <strong>{delivery.long}</strong>
            </li>
            <li>
              <span className="pdp__tick" aria-hidden="true">
                ✓
              </span>
              Free insured shipping · hallmark certificate in the parcel
            </li>
          </ul>

          <ProductOptions
            productOptions={productOptions}
            selectedVariant={selectedVariant}
          />

          <BuyControls
            selectedVariant={selectedVariant}
            inStock={inStock}
            metrics={metrics}
          />

          <SpecTable metrics={metrics} className="pdp__specs" />

          <Accordion
            className="pdp__accordion"
            defaultOpenId="care"
            items={[
              {
                id: 'care',
                label: 'Care & polishing',
                body: 'Wash with warm water and a soft cloth. A polishing cloth is included with every article.',
              },
              {
                id: 'shipping',
                label: 'Shipping & delivery',
                body: 'Free insured shipping above ₹ 5,000, despatched from our Coimbatore workshop. Prepaid orders only — UPI, cards and net banking.',
              },
              {
                id: 'returns',
                label: 'Returns & buyback',
                body: '7-day returns on unused articles in original packing. Lifetime buyback at the day’s silver rate.',
              },
              product.descriptionHtml
                ? {
                    id: 'description',
                    label: 'About this article',
                    body: (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: product.descriptionHtml,
                        }}
                      />
                    ),
                  }
                : null,
            ].filter(Boolean)}
          />
        </div>
      </div>

      <MakerBand />

      <Suspense fallback={null}>
        <Await resolve={recommended} errorElement={null}>
          {(products) => (
            <Recommendations
              products={(products ?? []).filter((p) => p.id !== product.id).slice(0, 4)}
              rate={rate}
              delivery={delivery}
            />
          )}
        </Await>
      </Suspense>

      {/* Mobile sticky buy bar — price, weight and both actions stay reachable. */}
      <StickyBuyBar
        selectedVariant={selectedVariant}
        metrics={metrics}
        inStock={inStock}
      />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price?.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

/**
 * Size and finish, as chips. A variant that does not exist is disabled rather
 * than hidden, so the range on offer stays legible.
 * @param {{productOptions: any[], selectedVariant: any}} props
 */
function ProductOptions({productOptions, selectedVariant}) {
  const navigate = useNavigate();

  return (
    <>
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;

        return (
          <div className="pdp__option-group" key={option.name}>
            <div className="pdp__option-label">{option.name}</div>
            <div className="chip-row">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                } = value;

                const className = [
                  'chip',
                  selected ? 'chip--selected' : '',
                  !available ? 'chip--unavailable' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                if (isDifferentProduct) {
                  return (
                    <Link
                      className={className}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      {name}
                    </Link>
                  );
                }

                return (
                  <button
                    type="button"
                    className={className}
                    key={option.name + name}
                    disabled={!exists}
                    aria-pressed={selected}
                    onClick={() => {
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {
                          replace: true,
                          preventScrollReset: true,
                        });
                      }
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <span className="sr-only">
        Selected: {selectedVariant?.title ?? 'default'}
      </span>
    </>
  );
}

/**
 * Quantity, Add to bag, Buy now.
 * @param {{selectedVariant: any, inStock: boolean, metrics: any}} props
 */
function BuyControls({selectedVariant, inStock, metrics}) {
  const [quantity, setQuantity] = useState(1);
  const {open} = useAside();

  // Hand-made articles are not stocked in depth. Larger runs go through the
  // bulk enquiry rather than the stepper.
  const MAX_QUANTITY = 10;
  const atMax = quantity >= MAX_QUANTITY;

  const lines = selectedVariant
    ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}]
    : [];

  return (
    <>
      <div className="pdp__buy">
        <div className="stepper">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            –
          </button>
          <span className="stepper__value" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={atMax}
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
          >
            +
          </button>
        </div>

        <AddToCartButton
          variant="primary"
          disabled={!inStock}
          onClick={() => open('cart')}
          lines={lines}
        >
          {inStock ? 'Add to bag' : 'Out of stock'}
        </AddToCartButton>

        <BuyNowButton lines={lines} disabled={!inStock} />
      </div>

      <p className="pdp__buy-note">
        {atMax ? (
          <>
            Ten is the most we sell online.{' '}
            <Link className="link-inline" to="/collections/bulk-corporate">
              Bulk enquiry →
            </Link>
            <br />
          </>
        ) : null}
        Buy now skips the bag — one page, guest checkout, UPI or card.
        {metrics.weightIsEstimated
          ? ' Weight shown is derived from price until the workshop records it.'
          : ''}
      </p>
    </>
  );
}

/**
 * Adds the line, then continues straight to checkout once the cart has
 * actually accepted it — never navigating on an optimistic assumption.
 * @param {{lines: any[], disabled: boolean}} props
 */
function BuyNowButton({lines, disabled}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => <BuyNowInner fetcher={fetcher} disabled={disabled} />}
    </CartForm>
  );
}

/** @param {{fetcher: any, disabled: boolean}} props */
function BuyNowInner({fetcher, disabled}) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pending && fetcher.state === 'idle' && fetcher.data) {
      setPending(false);
      void navigate('/checkout');
    }
  }, [pending, fetcher.state, fetcher.data, navigate]);

  return (
    <button
      type="submit"
      className="btn btn--secondary"
      disabled={disabled || fetcher.state !== 'idle'}
      onClick={() => setPending(true)}
    >
      Buy now
    </button>
  );
}

/** @param {{selectedVariant: any, metrics: any, inStock: boolean}} props */
function StickyBuyBar({selectedVariant, metrics, inStock}) {
  const {open} = useAside();
  const lines = selectedVariant
    ? [{merchandiseId: selectedVariant.id, quantity: 1, selectedVariant}]
    : [];

  return (
    <div className="buy-bar">
      <div className="buy-bar__price">
        <strong>{formatMoney(selectedVariant?.price)}</strong>
        <span>
          {metrics.weightGrams ? `${formatGrams(metrics.weightGrams)} · ` : ''}
          {inStock ? 'in stock' : 'made to order'}
        </span>
      </div>
      <AddToCartButton
        variant="primary"
        disabled={!inStock}
        onClick={() => open('cart')}
        lines={lines}
        formClassName="buy-bar__action"
      >
        {inStock ? 'Add to bag' : 'Out of stock'}
      </AddToCartButton>
      <BuyNowButton lines={lines} disabled={!inStock} />
    </div>
  );
}

/** @param {{products: any[], rate: any, delivery: any}} props */
function Recommendations({products, rate, delivery}) {
  if (!products?.length) return null;

  return (
    <section className="section">
      <div className="section__head">
        <h2 className="t-display-s">Often bought together</h2>
        <Link className="link-inline" to="/collections/pooja-articles">
          All pooja articles →
        </Link>
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <ProductTile
            key={product.id}
            product={product}
            metrics={getProductMetrics({
              product,
              variant: product.selectedOrFirstAvailableVariant,
              ratePerGram: rate.ratePerGram,
            })}
            deliveryDate={delivery.short}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    metafields(identifiers: [
      {namespace: "sha", key: "nett_weight_g"},
      {namespace: "sha", key: "making_charge"}
    ]) {
      key
      value
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    productType
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 5) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    metafields(identifiers: [
      {namespace: "sha", key: "nett_weight_g"},
      {namespace: "sha", key: "making_charge"},
      {namespace: "sha", key: "weight_tolerance_g"},
      {namespace: "sha", key: "purity"},
      {namespace: "sha", key: "huid"},
      {namespace: "sha", key: "dimensions"},
      {namespace: "sha", key: "finish_note"},
      {namespace: "sha", key: "made_at"},
      {namespace: "sha", key: "article_code"}
    ]) {
      key
      value
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
