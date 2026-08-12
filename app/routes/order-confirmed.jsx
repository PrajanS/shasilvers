/**
 * Order confirmation.
 *
 * Shopify's hosted checkout owns the thank-you page by default, so this route
 * is the storefront-side confirmation for when you point the order-status
 * redirect back here, or link to it from a Checkout UI extension. It is
 * deliberately factual: it shows the order reference it was given and the
 * despatch stage, and links to the real order record rather than
 * reconstructing line items it cannot verify.
 *
 * TODO(integration): once order-status redirects are configured, read the
 * order through the Customer Account API here — `app/routes/account.orders.$id`
 * already queries it — and render the articles beneath the tracker.
 */

import {useLoaderData, Link} from 'react-router';
import {CheckCircleIcon} from '~/components/Icons';
import {getDeliveryEstimate} from '~/lib/delivery';

/** @type {Route.MetaFunction} */
export const meta = () => [{title: 'Order placed — Sha Silvers'}];

/** @param {Route.LoaderArgs} args */
export async function loader({request}) {
  const url = new URL(request.url);

  return {
    orderNumber: url.searchParams.get('order'),
    delivery: getDeliveryEstimate(),
  };
}

const STAGES = ['Confirmed', 'Packed', 'Out for delivery'];

export default function OrderConfirmed() {
  /** @type {LoaderReturnData} */
  const {orderNumber, delivery} = useLoaderData();

  return (
    <div className="confirmation">
      <div className="confirmation__head">
        <span className="confirmation__mark">
          <CheckCircleIcon />
        </span>
        <h1 className="t-display-l">Order placed</h1>
        <p>
          {orderNumber ? `Order ${orderNumber}. ` : ''}
          Your invoice and hallmark certificates are on their way to your email.
        </p>
      </div>

      <div className="confirmation__body">
        <div className="tracker">
          <div className="tracker__title">Arriving {delivery.long}</div>
          <div className="tracker__bars" aria-hidden="true">
            <span className="is-done" />
            <span />
            <span />
          </div>
          <div className="tracker__labels">
            {STAGES.map((stage, index) => (
              <span key={stage} className={index === 0 ? 'is-current' : undefined}>
                {stage}
              </span>
            ))}
          </div>
        </div>

        <p className="t-meta">
          Hallmark certificate and GST invoice travel in the parcel. 7-day
          return on unused articles, lifetime buyback at the day’s rate.
        </p>

        <div className="confirmation__actions">
          <Link className="btn btn--secondary" to="/account/orders">
            Track order
          </Link>
          <Link className="btn btn--quickadd" to="/collections/pooja-articles">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

/** @typedef {import('./+types/order-confirmed').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
