import {Link, useLoaderData, useNavigation, useSearchParams} from 'react-router';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {Field} from '~/components/Field';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'Orders — Sha Silvers'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer, filters} = useLoaderData();
  const {orders} = customer;

  return (
    <section className="account-panel">
      <header className="account-panel__head">
        <h2 className="t-display-s">Orders</h2>
        <p className="t-meta">
          Every order placed with this account, newest first.
        </p>
      </header>

      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </section>
  );
}

/**
 * @param {{
 *   orders: CustomerOrdersFragment['orders'];
 *   filters: OrderFilterParams;
 * }}
 */
function OrdersTable({orders, filters}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="account-orders" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

/**
 * @param {{hasFilters?: boolean}}
 */
function EmptyOrders({hasFilters = false}) {
  return (
    <div className="empty-state">
      {hasFilters ? (
        <>
          <p>No orders match that search.</p>
          <Link className="btn btn--outline" to="/account/orders">
            Clear filters
          </Link>
        </>
      ) : (
        <>
          <p>You haven&apos;t placed an order yet.</p>
          <Link className="btn btn--primary" to="/collections">
            Browse the catalogue
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * Filter by order or confirmation number.
 *
 * Filters are URL state, the same as the listing facets, so a filtered view is
 * a link a customer can bookmark or send to us.
 *
 * @param {{currentFilters: OrderFilterParams}}
 */
function OrderSearchForm({currentFilters}) {
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="order-search"
      aria-label="Search orders"
    >
      <Field
        label="Order #"
        name={ORDER_FILTER_FIELDS.NAME}
        type="search"
        defaultValue={currentFilters.name || ''}
      />
      <Field
        label="Confirmation #"
        name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
        type="search"
        defaultValue={currentFilters.confirmationNumber || ''}
      />
      <div className="order-search__actions">
        <button
          type="submit"
          className="btn btn--outline"
          disabled={isSearching}
        >
          {isSearching ? 'Searching' : 'Search'}
        </button>
        {hasFilters ? (
          <button
            type="button"
            className="btn btn--outline"
            disabled={isSearching}
            onClick={() => {
              setSearchParams(new URLSearchParams());
              formRef.current?.reset();
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
    </form>
  );
}

/**
 * One order row.
 *
 * `Money` is correct here where it is wrong on a product tile: an order total
 * is what Shopify actually charged, not a figure to recalculate from today's
 * rate.
 *
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  const href = `/account/orders/${btoa(order.id)}`;

  return (
    <Link className="order-row" to={href}>
      <div className="order-row__main">
        <strong className="order-row__number">#{order.number}</strong>
        <span className="t-meta">
          {new Date(order.processedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        {order.confirmationNumber ? (
          <span className="t-meta">
            Confirmation {order.confirmationNumber}
          </span>
        ) : null}
      </div>

      <div className="order-row__status">
        <span className="order-row__badge">{order.financialStatus}</span>
        {fulfillmentStatus ? (
          <span className="order-row__badge">{fulfillmentStatus}</span>
        ) : null}
      </div>

      <div className="order-row__total t-price">
        <Money data={order.totalPrice} />
      </div>
    </Link>
  );
}

/**
 * @typedef {{
 *   customer: CustomerOrdersFragment;
 *   filters: OrderFilterParams;
 * }} OrdersLoaderData
 */

/** @typedef {import('./+types/account.orders._index').Route} Route */
/** @typedef {import('~/lib/orderFilters').OrderFilterParams} OrderFilterParams */
/** @typedef {import('customer-accountapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('customer-accountapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
