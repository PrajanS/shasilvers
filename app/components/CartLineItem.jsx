import {CartForm} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {useVariantUrl} from '~/lib/variants';
import {useAside} from '~/components/Aside';
import {MediaWell} from '~/components/MediaWell';
import {formatAmount} from '~/lib/money';
import {getCartLineMetrics} from '~/lib/pricing';

/**
 * One article in the bag: image, title, price, the options that were chosen,
 * a stepper and a remove control.
 *
 * @param {{layout: 'page'|'aside', line: any, childrenMap: Record<string, any[]>, rates?: any}} props
 */
export function CartLineItem({layout, line, childrenMap, rates}) {
  const {id, merchandise, quantity, isOptimistic} = line;
  const {product, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const children = childrenMap[id];

  // Priced here the same way it was priced on the product page: today's
  // rate for its metal × its nett weight, plus making, times the quantity.
  const {lineTotal, currencyCode} = getCartLineMetrics(line, rates);

  // "218 g · mirror finish" — the options as a single quiet line.
  const optionSummary = selectedOptions
    .filter((option) => option.value && option.value !== 'Default Title')
    .map((option) => option.value)
    .join(' · ');

  return (
    <li className="cart-line">
      <MediaWell
        data={image}
        note="1:1"
        sizes="76px"
        className="cart-line__media"
      />

      <div>
        <div className="cart-line__head">
          <Link
            className="cart-line__title"
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') close();
            }}
          >
            {product.title}
          </Link>
          <span className="cart-line__price">
            {lineTotal === null ? null : formatAmount(lineTotal, currencyCode)}
          </span>
        </div>

        {optionSummary ? (
          <div className="cart-line__meta">{optionSummary}</div>
        ) : null}

        <div className="cart-line__controls">
          <CartLineQuantity
            lineId={id}
            quantity={quantity}
            isOptimistic={isOptimistic}
          />
          <CartLineRemoveButton lineIds={[id]} disabled={!!isOptimistic} />
        </div>

        {children?.length ? (
          <ul
            className="cart-children"
            aria-label={`Included with ${product.title}`}
          >
            {children.map((childLine) => (
              <CartLineItem
                key={childLine.id}
                line={childLine}
                layout={layout}
                childrenMap={childrenMap}
                rates={rates}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The stepper. Both controls keep the 44px minimum target the design specifies
 * — a bag is often operated one-handed on a phone.
 * @param {{lineId: string, quantity: number, isOptimistic?: boolean}} props
 */
function CartLineQuantity({lineId, quantity, isOptimistic}) {
  if (typeof quantity === 'undefined') return null;
  const prevQuantity = Math.max(0, quantity - 1);
  const nextQuantity = quantity + 1;

  return (
    <div className="stepper stepper--compact">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          type="submit"
          aria-label="Decrease quantity"
          disabled={quantity <= 1 || !!isOptimistic}
        >
          –
        </button>
      </CartLineUpdateButton>

      <span className="stepper__value" aria-live="polite">
        {quantity}
      </span>

      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          type="submit"
          aria-label="Increase quantity"
          disabled={!!isOptimistic}
        >
          +
        </button>
      </CartLineUpdateButton>
    </div>
  );
}

/** @param {{lineIds: string[], disabled: boolean}} props */
function CartLineRemoveButton({lineIds, disabled}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button className="cart-line__remove" disabled={disabled} type="submit">
        Remove
      </button>
    </CartForm>
  );
}

/** @param {{children: React.ReactNode, lines: any[]}} props */
function CartLineUpdateButton({children, lines}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/**
 * A stable key per line so rapid +/- clicks cancel each other rather than
 * racing to the server out of order.
 * @param {string[]} lineIds
 */
function getUpdateKey(lineIds) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
