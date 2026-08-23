import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from '~/components/CartSummary';
import {formatAmount} from '~/lib/money';
import {cartTotals} from '~/lib/cart-totals';
import {FREE_SHIPPING_THRESHOLD, SHIPPING_FEE} from '~/lib/shop';

/**
 * Build a map of child lines (gift box, engraving) keyed by their parent, so
 * bundled components render nested under the article they belong to rather
 * than as separate rows the buyer did not knowingly add.
 * @param {any[]} lines
 */
function getLineItemChildrenMap(lines) {
  /** @type {Record<string, any[]>} */
  const children = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childLines] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childLines);
      }
    }
  }
  return children;
}

/**
 * The bag. Used by both the drawer and the /cart route.
 * @param {{cart: any, layout: 'page'|'aside', rates?: any}} props
 */
export function CartMain({cart: originalCart, layout, rates}) {
  // Applies pending line mutations immediately so the drawer never lags a click.
  const cart = useOptimisticCart(originalCart);

  const lines = cart?.lines?.nodes ?? [];
  const hasItems = (cart?.totalQuantity ?? 0) > 0;
  const childrenMap = getLineItemChildrenMap(lines);

  // The free-shipping threshold is measured against the same calculated
  // subtotal the summary shows, not Shopify’s.
  const totals = cartTotals(cart, rates);
  const subtotal = totals?.subtotal ?? 0;
  const currencyCode = totals?.currencyCode ?? 'INR';
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  if (!hasItems) {
    return (
      <section
        className={`cart-main ${layout === 'page' ? 'cart-main--page' : ''}`}
        aria-label={layout === 'page' ? 'Bag' : 'Bag drawer'}
      >
        <CartEmpty />
      </section>
    );
  }

  return (
    <section
      className={`cart-main ${layout === 'page' ? 'cart-main--page' : ''}`}
      aria-label={layout === 'page' ? 'Bag' : 'Bag drawer'}
    >
      {/* Stated at the top of the bag, where the saving is still actionable. */}
      {qualifiesForFreeShipping ? (
        <p className="cart-notice">
          Free insured shipping applied · you saved{' '}
          <span className="is-highlight">
            {formatAmount(SHIPPING_FEE, currencyCode)}
          </span>
        </p>
      ) : (
        <p className="cart-notice cart-notice--pending">
          Add{' '}
          <span className="is-highlight">
            {formatAmount(FREE_SHIPPING_THRESHOLD - subtotal, currencyCode)}
          </span>{' '}
          more for free insured shipping
        </p>
      )}

      <ul className="cart-lines" aria-label="Articles in your bag">
        {lines.map((line) => {
          // Child lines render nested under their parent, not at the root.
          if ('parentRelationship' in line && line.parentRelationship?.parent) {
            return null;
          }
          return (
            <CartLineItem
              key={line.id}
              line={line}
              layout={layout}
              childrenMap={childrenMap}
              rates={rates}
            />
          );
        })}
      </ul>

      <CartSummary cart={cart} rates={rates} />
    </section>
  );
}

function CartEmpty() {
  const {close} = useAside();
  return (
    <div className="cart-empty">
      <p>Your bag is empty.</p>
      <p>
        <Link
          to="/collections/pooja-articles"
          onClick={close}
          prefetch="viewport"
        >
          Browse pooja articles →
        </Link>
      </p>
    </div>
  );
}
