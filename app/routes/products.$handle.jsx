import {useEffect, useState} from 'react';
import {useLoaderData, useNavigate, Link} from 'react-router';
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
import {PriceNotice} from '~/components/PriceNotice';
import {SpecTable} from '~/components/SpecTable';
import {AddToCartButton} from '~/components/AddToCartButton';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {useAside} from '~/components/Aside';
import {getProductMetrics, buildCartLine} from '~/lib/pricing';
import {useCollectionPath} from '~/lib/collections';
import {getMetalRates} from '~/lib/metal-rates.server';
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
  return loadCriticalData(args);
}

/** @param {Route.LoaderArgs} args */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) throw new Error('Expected product handle to be defined');

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) throw new Response(null, {status: 404});

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
    rates: await getMetalRates(storefront),
    delivery: getDeliveryEstimate(),
  };
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, rates} = useLoaderData();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const metrics = getProductMetrics({
    product,
    variant: selectedVariant,
    rates,
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
        {/* Gallery and thumbs share one column, so the layout holds its
            shape whether the product has five images, one, or none. */}
        <div className="pdp__media">
          <MediaWell
            className="pdp__gallery"
            data={gallery[activeImage] ?? gallery[0]}
            note={product.title}
            sizes="(min-width: 901px) 45vw, 100vw"
            loading="eager"
          />

          {/* Only render the strip when there is genuinely more than one
              image to choose between; inert placeholders taught nothing. */}
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
                  <MediaWell data={image} note="" sizes="96px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pdp__main">
          <h1 className="t-display-l pdp__title">{product.title}</h1>

          <div className="pdp__price-row">
            {Number(metrics.price?.amount) > 0 ? (
              <span className="t-price-lg">{formatMoney(metrics.price)}</span>
            ) : (
              <span className="pdp__price-pending">Price on request</span>
            )}
          </div>

          <PriceBreakdown
            breakdown={metrics.breakdown}
            marketRate={metrics.rate?.market}
            className="pdp__breakdown"
            explainMaking
          />

          {/*
            Silent unless the calculated price and Shopify's disagree, in
            which case checkout would bill a figure this page never showed.
          */}
          <PriceNotice
            matches={metrics.priceMatchesShopify}
            quoted={metrics.breakdown?.total}
            charged={Number(metrics.shopifyPrice?.amount)}
            currencyCode={metrics.breakdown?.currencyCode}
            className="pdp__price-notice"
          />

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

          {product.descriptionHtml ? (
            <div
              className="pdp__description"
              dangerouslySetInnerHTML={{__html: product.descriptionHtml}}
            />
          ) : null}
        </div>
      </div>

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
              price: metrics.price?.amount || '0',
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
  const bulkPath = useCollectionPath('bulk-and-corporate', 'bulk-corporate');
  const [quantity, setQuantity] = useState(1);
  const {open} = useAside();

  // Hand-made articles are not stocked in depth. Larger runs go through the
  // bulk enquiry rather than the stepper.
  const MAX_QUANTITY = 10;
  const atMax = quantity >= MAX_QUANTITY;

  // Carries the rate, weight and making charge onto the order — see
  // `priceAttributes`. Today's rate cannot be recovered from a later one.
  const lines = selectedVariant
    ? [buildCartLine({variant: selectedVariant, metrics, quantity})]
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
            <Link className="link-inline" to={bulkPath}>
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
    ? [buildCartLine({variant: selectedVariant, metrics})]
    : [];

  return (
    <div className="buy-bar">
      <div className="buy-bar__price">
        <strong>
          {Number(metrics.price?.amount) > 0
            ? formatMoney(metrics.price)
            : 'Price on request'}
        </strong>
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
      {namespace: "custom", key: "metal_name"},
      {namespace: "custom", key: "metal_weight"},
      {namespace: "custom", key: "making_charge"},
      {namespace: "custom", key: "metal"},
      {namespace: "custom", key: "nett_weight_g"},
      {namespace: "sha", key: "metal"},
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
      {namespace: "custom", key: "metal_name"},
      {namespace: "custom", key: "metal_weight"},
      {namespace: "custom", key: "making_charge"},
      {namespace: "custom", key: "metal"},
      {namespace: "custom", key: "nett_weight_g"},
      {namespace: "sha", key: "metal"},
      {namespace: "sha", key: "nett_weight_g"},
      {namespace: "sha", key: "making_charge"}
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
