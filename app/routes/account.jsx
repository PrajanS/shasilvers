import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  useNavigation,
} from 'react-router';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

/**
 * The account shell: heading, section nav, sign out.
 *
 * Shopify owns the sign-in identity, so nothing here creates or authenticates
 * an account — these screens only read and amend what the customer already has.
 */
export function shouldRevalidate() {
  return true;
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        // Account pages are per-customer; never let a shared cache hold one.
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  const heading = customer?.firstName
    ? `Welcome, ${customer.firstName}`
    : 'Your account';

  return (
    <div className="account">
      <div className="account__head">
        <Breadcrumbs trail={[{label: 'Home', to: '/'}, {label: 'Account'}]} />
        <h1 className="t-display-l">{heading}</h1>
        {customer?.emailAddress?.emailAddress ? (
          <p className="t-meta">{customer.emailAddress.emailAddress}</p>
        ) : null}
      </div>

      <AccountMenu />

      <div className="account__body">
        <Outlet context={{customer}} />
      </div>
    </div>
  );
}

/**
 * Section nav. A real nav of real links — the active one is marked with
 * `aria-current` by NavLink, and underlined rather than merely bolded so the
 * state survives a colour-blind reader.
 */
function AccountMenu() {
  return (
    <nav className="account__nav" aria-label="Account sections">
      <div className="account__tabs">
        <NavLink className="account__tab" to="/account/orders">
          Orders
        </NavLink>
        <NavLink className="account__tab" to="/account/profile">
          Profile
        </NavLink>
        <NavLink className="account__tab" to="/account/addresses">
          Addresses
        </NavLink>
      </div>
      <Logout />
    </nav>
  );
}

function Logout() {
  const {state, formAction} = useNavigation();
  const signingOut = state !== 'idle' && formAction === '/account/logout';

  return (
    <Form method="POST" action="/account/logout">
      <button type="submit" className="btn btn--outline" disabled={signingOut}>
        {signingOut ? 'Signing out' : 'Sign out'}
      </button>
    </Form>
  );
}

/** @typedef {import('./+types/account').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
