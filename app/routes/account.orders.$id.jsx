import {Link, redirect, useLoaderData} from 'react-router';
import {Money, Image} from '@shopify/hydrogen';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `Order ${data?.order?.name} — Sha Silvers`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  // The id arrives base64-encoded in the path. `atob` throws on malformed
  // input, which surfaced as a 500 rather than a 404 for anyone who edited the
  // URL, and the decoded value is only useful if it is actually an order gid.
  let orderId;
  try {
    orderId = atob(params.id);
  } catch {
    throw new Response('Order not found', {status: 404});
  }

  if (!/^gid:\/\/shopify\/Order\/\d+/.test(orderId)) {
    throw new Response('Order not found', {status: 404});
  }

  // Reading someone else's order is already prevented by the Customer Account
  // API, which scopes every query to the signed-in customer's token — a valid
  // id belonging to another customer simply returns nothing.
  const {data, errors} = await customerAccount.query(CUSTOMER_ORDER_QUERY, {
    variables: {
      orderId,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.order) {
    throw new Response('Order not found', {status: 404});
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' ? firstDiscount : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? firstDiscount.percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  /** @type {LoaderReturnData} */
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData();
  const hasDiscount = Boolean(
    (discountValue && discountValue.amount) || discountPercentage,
  );

  return (
    <section className="account-panel account-order">
      <header className="account-panel__head">
        <Link className="account-order__back" to="/account/orders">
          ← All orders
        </Link>
        <h2 className="t-display-s">Order {order.name}</h2>
        <p className="t-meta">
          Placed{' '}
          {new Date(order.processedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {order.confirmationNumber
            ? ` · confirmation ${order.confirmationNumber}`
            : ''}
        </p>
      </header>

      <div className="order-detail">
        <div className="order-detail__lines">
          <table className="order-table">
            <thead>
              <tr>
                <th scope="col">Article</th>
                <th scope="col">Price</th>
                <th scope="col">Qty</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((lineItem, lineItemIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
              ))}
            </tbody>
            <tfoot>
              {hasDiscount ? (
                <tr>
                  <th scope="row" colSpan={3}>
                    Discount
                  </th>
                  <td>
                    {discountPercentage ? (
                      <span>-{discountPercentage}%</span>
                    ) : (
                      discountValue && <Money data={discountValue} />
                    )}
                  </td>
                </tr>
              ) : null}
              <tr>
                <th scope="row" colSpan={3}>
                  Subtotal
                </th>
                <td>
                  <Money data={order.subtotal} />
                </td>
              </tr>
              <tr>
                <th scope="row" colSpan={3}>
                  Tax
                </th>
                <td>
                  <Money data={order.totalTax} />
                </td>
              </tr>
              <tr className="order-table__total">
                <th scope="row" colSpan={3}>
                  Total
                </th>
                <td>
                  <Money data={order.totalPrice} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <aside className="order-detail__side">
          <div className="order-detail__block">
            <h3 className="t-label">Delivery address</h3>
            {order?.shippingAddress ? (
              <address className="t-body">
                {order.shippingAddress.name}
                {order.shippingAddress.formatted ? (
                  <>
                    <br />
                    {order.shippingAddress.formatted}
                  </>
                ) : null}
                {order.shippingAddress.formattedArea ? (
                  <>
                    <br />
                    {order.shippingAddress.formattedArea}
                  </>
                ) : null}
              </address>
            ) : (
              <p className="t-meta">No delivery address on this order.</p>
            )}
          </div>

          <div className="order-detail__block">
            <h3 className="t-label">Status</h3>
            <p className="order-row__badge">{fulfillmentStatus}</p>
          </div>

          <a
            className="btn btn--outline"
            target="_blank"
            href={order.statusPageUrl}
            rel="noreferrer"
          >
            Track this order
          </a>
        </aside>
      </div>
    </section>
  );
}

/**
 * One line of the order.
 *
 * The last column is the line total — price × quantity — not the discount the
 * skeleton put there, which made a discounted line read as though it cost the
 * discount.
 *
 * @param {{lineItem: OrderLineItemFullFragment}}
 */
function OrderLineRow({lineItem}) {
  const unit = Number(lineItem.price?.amount);
  const lineTotal = Number.isFinite(unit)
    ? {
        amount: String(unit * (lineItem.quantity ?? 1)),
        currencyCode: lineItem.price.currencyCode,
      }
    : null;

  return (
    <tr>
      <td>
        <div className="order-table__article">
          {lineItem?.image ? (
            <Image data={lineItem.image} width={64} height={64} />
          ) : null}
          <div>
            <p className="order-table__title">{lineItem.title}</p>
            {lineItem.variantTitle &&
            lineItem.variantTitle !== 'Default Title' ? (
              <p className="t-meta">{lineItem.variantTitle}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td>
        <Money data={lineItem.price} />
      </td>
      <td>{lineItem.quantity}</td>
      <td>{lineTotal ? <Money data={lineTotal} /> : '—'}</td>
    </tr>
  );
}

/** @typedef {import('./+types/account.orders.$id').Route} Route */
/** @typedef {import('customer-accountapi.generated').OrderLineItemFullFragment} OrderLineItemFullFragment */
/** @typedef {import('customer-accountapi.generated').OrderQuery} OrderQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
