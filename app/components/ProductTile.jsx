import {Link} from 'react-router';
import {MediaWell} from '~/components/MediaWell';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {formatAmount, formatGrams, formatMoney} from '~/lib/money';

/**
 * The product tile.
 *
 * Weight, making charge and delivery date sit on the tile because they are
 * the three questions a silver buyer asks before clicking. Quick-add makes
 * buying from any grid a two-click journey: it fades in over the image on
 * hover, and on touch it is simply always there.
 *
 * @param {{
 *   product: any,
 *   metrics: any,
 *   deliveryDate?: string,
 *   loading?: 'eager'|'lazy',
 * }} props
 */
export function ProductTile({product, metrics, deliveryDate, loading}) {
  const {open} = useAside();
  const variant = product.selectedOrFirstAvailableVariant;
  const available = Boolean(variant?.id) && product.availableForSale !== false;
  const breakdown = metrics?.breakdown;

  return (
    <div className="tile">
      <div className="tile__media">
        <MediaWell
          data={product.featuredImage}
          note={`1:1 · ${product.title}`}
          loading={loading}
        />
        {available ? (
          <AddToCartButton
            variant="quickadd"
            formClassName="tile__quickadd"
            onClick={() => open('cart')}
            lines={[
              {
                merchandiseId: variant.id,
                quantity: 1,
                selectedVariant: variant,
              },
            ]}
          >
            Add to bag
          </AddToCartButton>
        ) : null}
      </div>

      <div className="tile__body">
        {product.productType ? (
          <div className="tile__category">{product.productType}</div>
        ) : null}

        <h3 className="tile__name">
          <Link
            className="tile__title-link"
            to={`/products/${product.handle}`}
            prefetch="intent"
          >
            {product.title}
          </Link>
        </h3>

        <div className="tile__price-row">
          <span className="t-price">{formatMoney(metrics?.price)}</span>
          {metrics?.weightGrams ? (
            <span className="tile__weight">
              {formatGrams(metrics.weightGrams)}
            </span>
          ) : null}
        </div>

        {breakdown ? (
          <div className="tile__making">
            incl. {formatAmount(breakdown.making, breakdown.currencyCode)}{' '}
            making
          </div>
        ) : null}

        {available && deliveryDate ? (
          <div className="tile__delivery">Delivery by {deliveryDate}</div>
        ) : (
          <div className="tile__madeorder">Made to order</div>
        )}
      </div>
    </div>
  );
}
